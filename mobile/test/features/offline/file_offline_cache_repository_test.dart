import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import 'package:cloudtune/features/offline/data/repositories/file_offline_cache_repository.dart';
import 'package:cloudtune/features/offline/domain/models/offline_download_record.dart';
import 'package:cloudtune/features/offline/domain/models/offline_download_state.dart';
import 'package:cloudtune/features/offline/domain/services/offline_path_policy.dart';

void main() {
  test('persists and reloads offline download records', () async {
    final directory = await Directory.systemTemp.createTemp('cloudtune_offline_test_');
    addTearDown(() async {
      if (await directory.exists()) {
        await directory.delete(recursive: true);
      }
    });

    final policy = OfflinePathPolicy(rootPath: directory.path);
    final repository = FileOfflineCacheRepository(pathPolicy: policy);
    final record = OfflineDownloadRecord(
      id: 'record-1',
      songId: 'song-1',
      title: 'Sample',
      artist: 'Artist',
      artworkUrl: null,
      sourceUrl: 'https://example.com/sample.mp3',
      localFilePath: '${directory.path}/files/sample.mp3',
      state: OfflineDownloadState.ready,
      progressPct: 100,
      deviceSessionId: 'device-1',
      fileSizeBytes: 1024,
      entitlementExpiresAt: null,
      downloadedAt: DateTime.parse('2024-01-01T00:00:00Z'),
      lastSyncedAt: DateTime.parse('2024-01-01T00:00:00Z'),
      errorMessage: null,
      createdAt: DateTime.parse('2024-01-01T00:00:00Z'),
      updatedAt: DateTime.parse('2024-01-01T00:00:00Z'),
    );

    await repository.upsert(record);

    final loaded = await repository.getBySongId('song-1');
    expect(loaded?.id, 'record-1');
    expect(await repository.listAll(), hasLength(1));

    await repository.remove('record-1');
    expect(await repository.listAll(), isEmpty);
  });
}
