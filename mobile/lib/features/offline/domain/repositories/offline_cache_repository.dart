import '../models/offline_download_record.dart';

abstract class OfflineCacheRepository {
  Future<List<OfflineDownloadRecord>> listAll();

  Future<OfflineDownloadRecord?> getBySongId(String songId);

  Future<OfflineDownloadRecord?> getById(String id);

  Future<void> upsert(OfflineDownloadRecord record);

  Future<void> remove(String id);

  Future<void> replaceAll(List<OfflineDownloadRecord> records);
}
