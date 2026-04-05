import 'offline_download_record.dart';

class OfflineSyncState {
  const OfflineSyncState({
    required this.isOnline,
    required this.records,
    required this.lastSyncedAt,
  });

  factory OfflineSyncState.initial() {
    return const OfflineSyncState(
      isOnline: true,
      records: <OfflineDownloadRecord>[],
      lastSyncedAt: null,
    );
  }

  final bool isOnline;
  final List<OfflineDownloadRecord> records;
  final DateTime? lastSyncedAt;

  OfflineSyncState copyWith({
    bool? isOnline,
    List<OfflineDownloadRecord>? records,
    DateTime? lastSyncedAt,
  }) {
    return OfflineSyncState(
      isOnline: isOnline ?? this.isOnline,
      records: records ?? this.records,
      lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
    );
  }
}
