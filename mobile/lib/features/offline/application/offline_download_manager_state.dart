import '../domain/models/offline_download_record.dart';

class OfflineDownloadManagerState {
  const OfflineDownloadManagerState({
    required this.records,
    required this.isOnline,
    required this.isLoading,
    required this.activeSongId,
    required this.lastMessage,
    required this.lastSyncedAt,
  });

  factory OfflineDownloadManagerState.initial() {
    return const OfflineDownloadManagerState(
      records: <OfflineDownloadRecord>[],
      isOnline: true,
      isLoading: true,
      activeSongId: null,
      lastMessage: null,
      lastSyncedAt: null,
    );
  }

  final List<OfflineDownloadRecord> records;
  final bool isOnline;
  final bool isLoading;
  final String? activeSongId;
  final String? lastMessage;
  final DateTime? lastSyncedAt;

  OfflineDownloadManagerState copyWith({
    List<OfflineDownloadRecord>? records,
    bool? isOnline,
    bool? isLoading,
    String? activeSongId,
    bool clearActiveSongId = false,
    String? lastMessage,
    bool clearLastMessage = false,
    DateTime? lastSyncedAt,
  }) {
    return OfflineDownloadManagerState(
      records: records ?? this.records,
      isOnline: isOnline ?? this.isOnline,
      isLoading: isLoading ?? this.isLoading,
      activeSongId: clearActiveSongId ? null : (activeSongId ?? this.activeSongId),
      lastMessage: clearLastMessage ? null : (lastMessage ?? this.lastMessage),
      lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
    );
  }
}
