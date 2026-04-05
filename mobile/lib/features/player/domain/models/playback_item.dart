class PlaybackItem {
  const PlaybackItem({
    required this.id,
    required this.title,
    this.artist,
    this.streamUrl,
    this.downloadUrl,
    this.localFilePath,
    this.offlineEntitled = false,
    this.offlineEntitlementExpiresAt,
    this.artworkUrl,
    this.duration,
  });

  final String id;
  final String title;
  final String? artist;
  final String? streamUrl;
  final String? downloadUrl;
  final String? localFilePath;
  final bool offlineEntitled;
  final DateTime? offlineEntitlementExpiresAt;
  final String? artworkUrl;
  final Duration? duration;

  bool get hasLocalCache => localFilePath != null && localFilePath!.isNotEmpty;

  bool get canPlayOffline {
    if (!offlineEntitled || !hasLocalCache) {
      return false;
    }

    final expiresAt = offlineEntitlementExpiresAt;
    if (expiresAt == null) {
      return true;
    }

    return expiresAt.isAfter(DateTime.now());
  }

  String? resolvePlaybackSource({required bool offlineMode}) {
    if (offlineMode && canPlayOffline) {
      return localFilePath;
    }

    if (streamUrl != null && streamUrl!.isNotEmpty) {
      return streamUrl;
    }

    return localFilePath;
  }
}
