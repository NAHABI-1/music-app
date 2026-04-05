import 'dart:math';

class OfflinePathPolicy {
  const OfflinePathPolicy({required this.rootPath});

  final String rootPath;

  String sanitizeComponent(String input) {
    final sanitized = input.replaceAll(RegExp(r'[^a-zA-Z0-9._-]'), '_');
    return sanitized.isEmpty ? 'file' : sanitized;
  }

  String extensionForContentType(String? contentType) {
    final normalized = (contentType ?? '').toLowerCase();
    if (normalized.contains('audio/mpeg')) return '.mp3';
    if (normalized.contains('audio/flac')) return '.flac';
    if (normalized.contains('audio/wav')) return '.wav';
    if (normalized.contains('audio/aac')) return '.aac';
    if (normalized.contains('audio/mp4')) return '.m4a';
    return '.bin';
  }

  String buildIndexFilePath() => '$rootPath/index.json';

  String buildSongFilePath({
    required String songId,
    required String recordId,
    String? contentType,
  }) {
    final safeSong = sanitizeComponent(songId);
    final safeRecord = sanitizeComponent(recordId);
    return '$rootPath/files/${safeSong}_$safeRecord${extensionForContentType(contentType)}';
  }

  String buildPartialFilePath({
    required String songId,
    required String recordId,
  }) {
    final safeSong = sanitizeComponent(songId);
    final safeRecord = sanitizeComponent(recordId);
    return '$rootPath/partials/${safeSong}_$safeRecord.part';
  }

  String buildRecordId(String songId) {
    final seed = '$songId-${DateTime.now().microsecondsSinceEpoch}-${Random().nextInt(1 << 32)}';
    return seed.replaceAll(RegExp(r'[^a-zA-Z0-9._-]'), '_');
  }
}
