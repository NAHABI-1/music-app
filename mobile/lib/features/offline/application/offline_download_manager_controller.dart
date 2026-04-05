import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';

import '../../../core/utils/retry_policy.dart';
import '../../../player/domain/models/playback_item.dart';
import '../data/repositories/file_offline_cache_repository.dart';
import '../data/services/http_offline_download_transport.dart';
import '../domain/models/offline_download_record.dart';
import '../domain/models/offline_download_state.dart';
import '../domain/repositories/offline_cache_repository.dart';
import '../domain/services/offline_download_transport.dart';
import '../domain/services/offline_path_policy.dart';
import 'offline_download_manager_state.dart';

class OfflineDownloadManagerController extends ChangeNotifier {
  OfflineDownloadManagerController({
    required OfflineCacheRepository cacheRepository,
    required OfflineDownloadTransport downloadTransport,
    required OfflinePathPolicy pathPolicy,
    required this.deviceSessionId,
  })  : _cacheRepository = cacheRepository,
        _downloadTransport = downloadTransport,
        _pathPolicy = pathPolicy;

  factory OfflineDownloadManagerController.defaultController({
    required String rootPath,
    required String deviceSessionId,
  }) {
    final pathPolicy = OfflinePathPolicy(rootPath: rootPath);
    return OfflineDownloadManagerController(
      cacheRepository: FileOfflineCacheRepository(pathPolicy: pathPolicy),
      downloadTransport: HttpOfflineDownloadTransport(),
      pathPolicy: pathPolicy,
      deviceSessionId: deviceSessionId,
    );
  }

  final OfflineCacheRepository _cacheRepository;
  final OfflineDownloadTransport _downloadTransport;
  final OfflinePathPolicy _pathPolicy;
  final String deviceSessionId;

  final Map<String, bool> _cancelledByRecordId = <String, bool>{};
  OfflineDownloadManagerState _state = OfflineDownloadManagerState.initial();
  OfflineDownloadManagerState get state => _state;

  Future<void> initialize() async {
    final records = await _cacheRepository.listAll();
    _state = _state.copyWith(
      records: records,
      isLoading: false,
      lastSyncedAt: DateTime.now(),
    );
    notifyListeners();
  }

  Future<void> refresh() async {
    await initialize();
  }

  Future<void> setOnline(bool isOnline) async {
    _state = _state.copyWith(isOnline: isOnline);
    notifyListeners();

    if (isOnline) {
      await syncWithServer();
    }
  }

  Future<void> syncWithServer() async {
    final records = await _cacheRepository.listAll();
    final reconciled = <OfflineDownloadRecord>[];

    for (final record in records) {
      final localFile = record.localFilePath == null ? null : File(record.localFilePath!);
      final fileExists = localFile?.existsSync() ?? false;
      if (record.state == OfflineDownloadState.ready && !fileExists) {
        reconciled.add(
          record.copyWith(
            state: OfflineDownloadState.failed,
            progressPct: 0,
            errorMessage: 'Cached file missing',
            updatedAt: DateTime.now(),
          ),
        );
        continue;
      }
      reconciled.add(record.copyWith(lastSyncedAt: DateTime.now()));
    }

    await _cacheRepository.replaceAll(reconciled);
    _state = _state.copyWith(
      records: reconciled,
      lastSyncedAt: DateTime.now(),
      clearLastMessage: true,
    );
    notifyListeners();
  }

  Future<void> markSongForOffline(
    PlaybackItem item, {
    Uri? sourceUri,
  }) async {
    final recordId = _pathPolicy.buildRecordId(item.id);
    final record = OfflineDownloadRecord(
      id: recordId,
      songId: item.id,
      title: item.title,
      artist: item.artist,
      artworkUrl: item.artworkUrl,
      sourceUrl: (sourceUri ?? _fallbackSourceFor(item)).toString(),
      localFilePath: _pathPolicy.buildSongFilePath(
        songId: item.id,
        recordId: recordId,
      ),
      state: OfflineDownloadState.queued,
      progressPct: 0,
      deviceSessionId: deviceSessionId,
      fileSizeBytes: null,
      entitlementExpiresAt: item.offlineEntitlementExpiresAt,
      downloadedAt: null,
      lastSyncedAt: null,
      errorMessage: null,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    await _cacheRepository.upsert(record);
    _replaceRecord(record);
    notifyListeners();
    unawaited(_startDownload(record, sourceUri: sourceUri ?? _fallbackSourceFor(item)));
  }

  Future<void> pauseDownload(String songId) async {
    final record = _recordForSong(songId);
    if (record == null) {
      return;
    }
    _cancelledByRecordId[record.id] = true;
    await _updateRecord(
      record.copyWith(
        state: OfflineDownloadState.paused,
        updatedAt: DateTime.now(),
      ),
    );
  }

  Future<void> resumeDownload(String songId) async {
    final record = _recordForSong(songId);
    if (record == null || record.sourceUrl == null || record.sourceUrl!.isEmpty) {
      return;
    }
    await _startDownload(record, sourceUri: Uri.parse(record.sourceUrl!));
  }

  Future<void> retryDownload(String songId) async {
    final record = _recordForSong(songId);
    if (record == null || record.sourceUrl == null || record.sourceUrl!.isEmpty) {
      return;
    }
    await _startDownload(record, sourceUri: Uri.parse(record.sourceUrl!));
  }

  Future<void> removeDownload(String songId) async {
    final record = _recordForSong(songId);
    if (record == null) {
      return;
    }

    final filePath = record.localFilePath;
    if (filePath != null) {
      final file = File(filePath);
      if (await file.exists()) {
        await file.delete();
      }
    }

    await _cacheRepository.remove(record.id);
    _state = _state.copyWith(
      records: _state.records.where((entry) => entry.id != record.id).toList(growable: false),
      clearActiveSongId: _state.activeSongId == record.songId,
    );
    notifyListeners();
  }

  PlaybackItem? playbackItemForSongId(String songId) {
    final record = _recordForSong(songId);
    if (record == null) {
      return null;
    }

    final localPath = record.localFilePath;
    if (!record.canPlayOffline || localPath == null || !File(localPath).existsSync()) {
      return null;
    }

    return record.toPlaybackItem();
  }

  Future<void> _startDownload(
    OfflineDownloadRecord record, {
    required Uri sourceUri,
  }) async {
    final localPath = record.localFilePath;
    if (localPath == null || localPath.isEmpty) {
      await _markFailed(record, 'Missing local file path');
      return;
    }

    final destination = File(localPath);
    await destination.parent.create(recursive: true);

    final existingLength = await destination.exists() ? await destination.length() : 0;
    final resetRecord = record.copyWith(
      state: OfflineDownloadState.downloading,
      progressPct: existingLength > 0 ? record.progressPct : 0,
      errorMessage: null,
      updatedAt: DateTime.now(),
      lastSyncedAt: DateTime.now(),
    );
    await _cacheRepository.upsert(resetRecord);
    _replaceRecord(resetRecord);
    _state = _state.copyWith(activeSongId: record.songId, lastMessage: null);
    notifyListeners();

    _cancelledByRecordId[record.id] = false;
    try {
      await runWithRetry<void>(
        () => _downloadTransport.downloadFile(
          sourceUri: sourceUri,
          destinationFile: destination,
          startByte: existingLength,
          onProgress: (progress) {
            final updated = resetRecord.copyWith(
              state: OfflineDownloadState.downloading,
              progressPct: progress.progressPct,
              fileSizeBytes: progress.totalBytes,
              updatedAt: DateTime.now(),
              lastSyncedAt: DateTime.now(),
            );
            unawaited(_updateRecord(updated));
          },
          isCancelled: () => _cancelledByRecordId[record.id] ?? false,
        ),
        policy: const RetryPolicy(maxAttempts: 3, baseDelay: Duration(milliseconds: 400)),
        shouldRetry: (error) {
          if (_cancelledByRecordId[record.id] ?? false) {
            return false;
          }
          return error is! FileSystemException;
        },
      );

      final completed = resetRecord.copyWith(
        state: OfflineDownloadState.ready,
        progressPct: 100,
        downloadedAt: DateTime.now(),
        lastSyncedAt: DateTime.now(),
        updatedAt: DateTime.now(),
        errorMessage: null,
      );
      await _updateRecord(completed);
      _state = _state.copyWith(
        activeSongId: null,
        lastMessage: 'Downloaded ${record.title}',
        lastSyncedAt: DateTime.now(),
      );
      notifyListeners();
    } on FileSystemException catch (error) {
      await _markFailed(resetRecord, error.message);
    } catch (error) {
      if (_cancelledByRecordId[record.id] ?? false) {
        return;
      }
      await _markFailed(resetRecord, error.toString());
    }
  }

  Future<void> _markFailed(
    OfflineDownloadRecord record,
    String message,
  ) async {
    final failed = record.copyWith(
      state: OfflineDownloadState.failed,
      progressPct: record.progressPct,
      errorMessage: message,
      updatedAt: DateTime.now(),
      lastSyncedAt: DateTime.now(),
    );
    await _updateRecord(failed);
    _state = _state.copyWith(
      activeSongId: null,
      lastMessage: message,
    );
    notifyListeners();
  }

  Future<void> _updateRecord(OfflineDownloadRecord record) async {
    await _cacheRepository.upsert(record);
    _replaceRecord(record);
    notifyListeners();
  }

  void _replaceRecord(OfflineDownloadRecord record) {
    final nextRecords = <OfflineDownloadRecord>[
      for (final current in _state.records)
        if (current.id != record.id) current,
      record,
    ]..sort((left, right) => right.updatedAt.compareTo(left.updatedAt));
    _state = _state.copyWith(records: nextRecords);
  }

  OfflineDownloadRecord? _recordForSong(String songId) {
    for (final record in _state.records) {
      if (record.songId == songId) {
        return record;
      }
    }
    return null;
  }

  Uri _fallbackSourceFor(PlaybackItem item) {
    final text = 'Offline cache for ${item.title}';
    return Uri.dataFromString(text, mimeType: 'audio/mpeg');
  }
}
