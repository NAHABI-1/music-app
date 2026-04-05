import 'dart:convert';
import 'dart:io';

import '../../domain/services/offline_download_transport.dart';

class HttpOfflineDownloadTransport implements OfflineDownloadTransport {
  @override
  Future<void> downloadFile({
    required Uri sourceUri,
    required File destinationFile,
    required int startByte,
    required void Function(OfflineDownloadProgress progress) onProgress,
    required bool Function() isCancelled,
  }) async {
    if (sourceUri.scheme == 'data') {
      final data = sourceUri.data;
      if (data == null) {
        throw const FormatException('Invalid data URI');
      }
      final bytes = data.contentAsBytes();
      final slice = startByte > 0 && startByte < bytes.length ? bytes.sublist(startByte) : bytes;
      await destinationFile.writeAsBytes(slice, flush: true);
      onProgress(OfflineDownloadProgress(receivedBytes: bytes.length, totalBytes: bytes.length));
      return;
    }

    if (sourceUri.scheme == 'file') {
      final bytes = await File.fromUri(sourceUri).readAsBytes();
      final slice = startByte > 0 && startByte < bytes.length ? bytes.sublist(startByte) : bytes;
      await destinationFile.writeAsBytes(slice, flush: true);
      onProgress(OfflineDownloadProgress(receivedBytes: bytes.length, totalBytes: bytes.length));
      return;
    }

    final client = HttpClient();
    try {
      final request = await client.getUrl(sourceUri);
      if (startByte > 0) {
        request.headers.set(HttpHeaders.rangeHeader, 'bytes=$startByte-');
      }
      final response = await request.close();
      if (response.statusCode >= 400) {
        throw HttpException('Download failed with status ${response.statusCode}', uri: sourceUri);
      }

      final expectedTotal = response.contentLength >= 0 ? response.contentLength + startByte : null;
      final sink = destinationFile.openWrite(mode: startByte > 0 ? FileMode.append : FileMode.write);
      var receivedBytes = startByte;

      await for (final chunk in response) {
        if (isCancelled()) {
          await sink.flush();
          await sink.close();
          return;
        }
        sink.add(chunk);
        receivedBytes += chunk.length;
        onProgress(OfflineDownloadProgress(receivedBytes: receivedBytes, totalBytes: expectedTotal));
      }

      await sink.flush();
      await sink.close();
    } finally {
      client.close(force: true);
    }
  }
}
