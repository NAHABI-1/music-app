import 'dart:io';

class OfflineDownloadProgress {
  const OfflineDownloadProgress({
    required this.receivedBytes,
    required this.totalBytes,
  });

  final int receivedBytes;
  final int? totalBytes;

  int get progressPct {
    if (totalBytes == null || totalBytes == 0) {
      return 0;
    }
    return ((receivedBytes / totalBytes!) * 100).clamp(0, 100).round();
  }
}

abstract class OfflineDownloadTransport {
  Future<void> downloadFile({
    required Uri sourceUri,
    required File destinationFile,
    required int startByte,
    required void Function(OfflineDownloadProgress progress) onProgress,
    required bool Function() isCancelled,
  });
}
