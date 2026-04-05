import 'dart:convert';
import 'dart:io';

import '../../domain/models/offline_download_record.dart';
import '../../domain/repositories/offline_cache_repository.dart';
import '../../domain/services/offline_path_policy.dart';

class FileOfflineCacheRepository implements OfflineCacheRepository {
  FileOfflineCacheRepository({required OfflinePathPolicy pathPolicy})
      : _pathPolicy = pathPolicy,
        _indexFile = File(pathPolicy.buildIndexFilePath());

  final OfflinePathPolicy _pathPolicy;
  final File _indexFile;

  Future<void> _ensureStorage() async {
    await Directory(_pathPolicy.rootPath).create(recursive: true);
    await _indexFile.parent.create(recursive: true);
    if (!await _indexFile.exists()) {
      await _indexFile.writeAsString('[]', flush: true);
    }
  }

  Future<List<OfflineDownloadRecord>> _readRecords() async {
    await _ensureStorage();
    final raw = await _indexFile.readAsString();
    if (raw.trim().isEmpty) {
      return <OfflineDownloadRecord>[];
    }

    final decoded = jsonDecode(raw);
    if (decoded is! List) {
      return <OfflineDownloadRecord>[];
    }

    return decoded
        .whereType<Map>()
        .map((entry) => OfflineDownloadRecord.fromJson(Map<String, dynamic>.from(entry)))
        .toList(growable: false)
      ..sort((left, right) => right.updatedAt.compareTo(left.updatedAt));
  }

  Future<void> _writeRecords(List<OfflineDownloadRecord> records) async {
    await _ensureStorage();
    final encoded = jsonEncode(records.map((record) => record.toJson()).toList(growable: false));
    await _indexFile.writeAsString(encoded, flush: true);
  }

  @override
  Future<OfflineDownloadRecord?> getById(String id) async {
    final records = await _readRecords();
    for (final record in records) {
      if (record.id == id) {
        return record;
      }
    }
    return null;
  }

  @override
  Future<OfflineDownloadRecord?> getBySongId(String songId) async {
    final records = await _readRecords();
    for (final record in records) {
      if (record.songId == songId) {
        return record;
      }
    }
    return null;
  }

  @override
  Future<List<OfflineDownloadRecord>> listAll() async {
    return _readRecords();
  }

  @override
  Future<void> remove(String id) async {
    final records = await _readRecords();
    final next = records.where((record) => record.id != id).toList(growable: false);
    await _writeRecords(next);
  }

  @override
  Future<void> replaceAll(List<OfflineDownloadRecord> records) async {
    await _writeRecords(records.toList(growable: false));
  }

  @override
  Future<void> upsert(OfflineDownloadRecord record) async {
    final records = await _readRecords();
    final next = <OfflineDownloadRecord>[
      for (final current in records)
        if (current.id != record.id) current,
      record,
    ]..sort((left, right) => right.updatedAt.compareTo(left.updatedAt));
    await _writeRecords(next);
  }
}
