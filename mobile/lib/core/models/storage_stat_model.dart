class StorageStat {
  final int totalBytes;
  final int usedBytes;

  StorageStat({
    required this.totalBytes,
    required this.usedBytes,
  }) : assert(totalBytes >= 0, 'totalBytes must be non-negative'),
        assert(usedBytes >= 0, 'usedBytes must be non-negative'),
        assert(usedBytes <= totalBytes, 'usedBytes cannot exceed totalBytes');

  /// Returns usage percentage, safe division - returns 0 if totalBytes is 0
  double get usagePercentage {
    if (totalBytes == 0) return 0.0;
    return (usedBytes / totalBytes) * 100;
  }
  int get availableBytes => totalBytes - usedBytes;

  String get availableFormatted => _formatBytes(availableBytes);
  String get usedFormatted => _formatBytes(usedBytes);
  String get totalFormatted => _formatBytes(totalBytes);

  static String _formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024)
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }
}
