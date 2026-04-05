import 'dart:io';

import 'offline_download_manager_controller.dart';

Future<OfflineDownloadManagerController> createDefaultOfflineDownloadManager() async {
  final controller = OfflineDownloadManagerController.defaultController(
    rootPath: '${Directory.systemTemp.path}/cloudtune_offline',
    deviceSessionId: 'device_${DateTime.now().millisecondsSinceEpoch}',
  );
  await controller.initialize();
  return controller;
}
