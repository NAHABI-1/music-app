import '../../../player/domain/models/playback_item.dart';
import 'offline_download_state.dart';

class OfflineDownloadRecord {
  const OfflineDownloadRecord({
    required this.id,
    required this.songId,
    required this.title,
    this.artist,
    this.artworkUrl,
    this.sourceUrl,
    this.localFilePath,
    required this.state,
    required this.progressPct,
    required this.deviceSessionId,
    this.fileSizeBytes,
    this.entitlementExpiresAt,
    this.downloadedAt,
    this.lastSyncedAt,
    this.errorMessage,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String songId;
  final String title;
  final String? artist;
  final String? artworkUrl;
  final String? sourceUrl;
  final String? localFilePath;
  final OfflineDownloadState state;
  final int progressPct;
  final String deviceSessionId;
  final int? fileSizeBytes;
  final DateTime? entitlementExpiresAt;
  final DateTime? downloadedAt;
  final DateTime? lastSyncedAt;
  final String? errorMessage;
  final DateTime createdAt;
  final DateTime updatedAt;

  bool get canPlayOffline =>
      state == OfflineDownloadState.ready &&
      localFilePath != null &&
      localFilePath!.isNotEmpty &&
      (entitlementExpiresAt == null || entitlementExpiresAt!.isAfter(DateTime.now()));

  bool get isActive =>
      state == OfflineDownloadState.queued ||
      state == OfflineDownloadState.downloading ||
      state == OfflineDownloadState.paused;

  PlaybackItem toPlaybackItem() {
    return PlaybackItem(
      id: songId,
      title: title,
      artist: artist,
      streamUrl: sourceUrl,
      downloadUrl: sourceUrl,
      localFilePath: localFilePath,
      offlineEntitled: canPlayOffline,
      offlineEntitlementExpiresAt: entitlementExpiresAt,
      artworkUrl: artworkUrl,
    );
  }

  OfflineDownloadRecord copyWith({
    String? id,
    String? songId,
    String? title,
    String? artist,
    String? artworkUrl,
    String? sourceUrl,
    String? localFilePath,
    OfflineDownloadState? state,
    int? progressPct,
    String? deviceSessionId,
    int? fileSizeBytes,
    DateTime? entitlementExpiresAt,
    DateTime? downloadedAt,
    DateTime? lastSyncedAt,
    String? errorMessage,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return OfflineDownloadRecord(
      id: id ?? this.id,
      songId: songId ?? this.songId,
      title: title ?? this.title,
      artist: artist ?? this.artist,
      artworkUrl: artworkUrl ?? this.artworkUrl,
      sourceUrl: sourceUrl ?? this.sourceUrl,
      localFilePath: localFilePath ?? this.localFilePath,
      state: state ?? this.state,
      progressPct: progressPct ?? this.progressPct,
      deviceSessionId: deviceSessionId ?? this.deviceSessionId,
      fileSizeBytes: fileSizeBytes ?? this.fileSizeBytes,
      entitlementExpiresAt: entitlementExpiresAt ?? this.entitlementExpiresAt,
      downloadedAt: downloadedAt ?? this.downloadedAt,
      lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
      errorMessage: errorMessage ?? this.errorMessage,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'songId': songId,
      'title': title,
      'artist': artist,
      'artworkUrl': artworkUrl,
      'sourceUrl': sourceUrl,
      'localFilePath': localFilePath,
      'state': state.name,
      'progressPct': progressPct,
      'deviceSessionId': deviceSessionId,
      'fileSizeBytes': fileSizeBytes,
      'entitlementExpiresAt': entitlementExpiresAt?.toIso8601String(),
      'downloadedAt': downloadedAt?.toIso8601String(),
      'lastSyncedAt': lastSyncedAt?.toIso8601String(),
      'errorMessage': errorMessage,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory OfflineDownloadRecord.fromJson(Map<String, dynamic> json) {
    return OfflineDownloadRecord(
      id: json['id'] as String,
      songId: json['songId'] as String,
      title: json['title'] as String,
      artist: json['artist'] as String?,
      artworkUrl: json['artworkUrl'] as String?,
      sourceUrl: json['sourceUrl'] as String?,
      localFilePath: json['localFilePath'] as String?,
      state: OfflineDownloadState.values.firstWhere(
        (state) => state.name == (json['state'] as String),
        orElse: () => OfflineDownloadState.failed,
      ),
      progressPct: json['progressPct'] as int? ?? 0,
      deviceSessionId: json['deviceSessionId'] as String,
      fileSizeBytes: json['fileSizeBytes'] as int?,
      entitlementExpiresAt: _parseDate(json['entitlementExpiresAt']),
      downloadedAt: _parseDate(json['downloadedAt']),
      lastSyncedAt: _parseDate(json['lastSyncedAt']),
      errorMessage: json['errorMessage'] as String?,
      createdAt: _parseDate(json['createdAt']) ?? DateTime.now(),
      updatedAt: _parseDate(json['updatedAt']) ?? DateTime.now(),
    );
  }

  static DateTime? _parseDate(dynamic value) {
    if (value == null) {
      return null;
    }
    return DateTime.tryParse(value as String);
  }
}
