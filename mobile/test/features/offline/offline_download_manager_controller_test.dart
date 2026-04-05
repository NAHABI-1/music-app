import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import 'package:cloudtune/features/offline/application/offline_download_manager_controller.dart';
import 'package:cloudtune/features/offline/data/repositories/file_offline_cache_repository.dart';
import 'package:cloudtune/features/offline/domain/models/offline_download_record.dart';
import 'package:cloudtune/features/offline/domain/models/offline_download_state.dart';
import 'package:cloudtune/features/offline/domain/repositories/offline_cache_repository.dart';
import 'package:cloudtune/features/offline/domain/services/offline_download_transport.dart';
import 'package:cloudtune/features/offline/domain/services/offline_path_policy.dart';
import 'package:cloudtune/features/player/domain/models/playback_item.dart';

class FakeOfflineDownloadTransport implements OfflineDownloadTransport {
  FakeOfflineDownloadTransport({this.chunkCount = 2});

  final int chunkCount;

  @override
  Future<void> downloadFile({
    required Uri sourceUri,
    required File destinationFile,
    required int startByte,
    required void Function(OfflineDownloadProgress progress) onProgress,
    required bool Function() isCancelled,
  }) async {
    final bytes = List<int>.generate(16, (index) => index + 1);
    final sink = destinationFile.openWrite(mode: startByte > 0 ? FileMode.append : FileMode.write);
    var received = startByte;

    for (var index = 0; index < chunkCount; index += 1) {
      if (isCancelled()) {
        await sink.close();
        return;
      }
      final chunk = bytes.sublist(index * 4, (index * 4 + 4).clamp(0, bytes.length));
      sink.add(chunk);
      received += chunk.length;
      onProgress(OfflineDownloadProgress(receivedBytes: received, totalBytes: bytes.length));
    }

    await sink.flush();
    await sink.close();
  }
}

class MemoryOfflineCacheRepository implements OfflineCacheRepository {
  final Map<String, OfflineDownloadRecord> _recordsById = <String, OfflineDownloadRecord>{};

  @override
  Future<OfflineDownloadRecord?> getById(String id) async => _recordsById[id];

  @override
  Future<OfflineDownloadRecord?> getBySongId(String songId) async {
    for (final record in _recordsById.values) {
      if (record.songId == songId) {
        return record;
      }
    }
    return null;
  }

  @override
  Future<List<OfflineDownloadRecord>> listAll() async {
    final records = _recordsById.values.toList(growable: false);
    records.sort((left, right) => right.updatedAt.compareTo(left.updatedAt));
    return records;
  }

  @override
  Future<void> remove(String id) async {
    _recordsById.remove(id);
  }

  @override
  Future<void> replaceAll(List<OfflineDownloadRecord> records) async {
    _recordsById
      ..clear()
      ..addEntries(records.map((record) => MapEntry(record.id, record)));
  }

  @override
  Future<void> upsert(OfflineDownloadRecord record) async {
    _recordsById[record.id] = record;
  }
}

Future<OfflineDownloadManagerController> createController({
  required Directory directory,
  required OfflineDownloadTransport transport,
}) async {
  final pathPolicy = OfflinePathPolicy(rootPath: directory.path);
  final controller = OfflineDownloadManagerController(
    cacheRepository: FileOfflineCacheRepository(pathPolicy: pathPolicy),
    downloadTransport: transport,
    pathPolicy: pathPolicy,
    deviceSessionId: 'device-1',
  );
  await controller.initialize();
  return controller;
}

void main() {
  test('markSongForOffline downloads and exposes a playable cached item', () async {
    final directory = await Directory.systemTemp.createTemp('cloudtune_offline_controller_');
    addTearDown(() async {
      if (await directory.exists()) {
        await directory.delete(recursive: true);
      }
    });

    final controller = await createController(
      directory: directory,
      transport: FakeOfflineDownloadTransport(),
    );

    await controller.markSongForOffline(
      const PlaybackItem(
        id: 'song-1',
        title: 'Sample Song',
        artist: 'Artist',
        streamUrl: 'https://example.com/sample.mp3',
      ),
      sourceUri: Uri.parse('https://example.com/sample.mp3'),
    );

    final record = controller.state.records.firstWhere((entry) => entry.songId == 'song-1');
    expect(record.state, OfflineDownloadState.ready);
    expect(record.progressPct, 100);
    expect(await File(record.localFilePath!).exists(), isTrue);

    final playbackItem = controller.playbackItemForSongId('song-1');
    expect(playbackItem?.localFilePath, record.localFilePath);
    expect(playbackItem?.canPlayOffline, isTrue);
  });

  test('playbackItemForSongId returns null when the cached file is missing', () async {
    final directory = await Directory.systemTemp.createTemp('cloudtune_offline_controller_missing_');
    addTearDown(() async {
      if (await directory.exists()) {
        await directory.delete(recursive: true);
      }
    });

    final pathPolicy = OfflinePathPolicy(rootPath: directory.path);
    final repository = MemoryOfflineCacheRepository();
    final record = OfflineDownloadRecord(
      id: 'record-1',
      songId: 'song-1',
      title: 'Sample Song',
      artist: 'Artist',
      artworkUrl: null,
      sourceUrl: 'https://example.com/sample.mp3',
      localFilePath: '${directory.path}/missing.mp3',
      state: OfflineDownloadState.ready,
      progressPct: 100,
      deviceSessionId: 'device-1',
      fileSizeBytes: 1024,
      entitlementExpiresAt: null,
      downloadedAt: DateTime.now(),
      lastSyncedAt: DateTime.now(),
      errorMessage: null,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
    await repository.upsert(record);

    final controller = OfflineDownloadManagerController(
      cacheRepository: repository,
      downloadTransport: FakeOfflineDownloadTransport(),
      pathPolicy: pathPolicy,
      deviceSessionId: 'device-1',
    );
    await controller.initialize();

    expect(controller.playbackItemForSongId('song-1'), isNull);
  });
}
