import 'package:flutter/material.dart';

import 'app/app.dart';
import 'features/monetization/application/monetization_bootstrap.dart';
import 'features/offline/application/offline_bootstrap.dart';
import 'features/player/application/player_bootstrap.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final playerController = await createDefaultPlayerController();
  final offlineController = await createDefaultOfflineDownloadManager();
  final monetizationController = await createDefaultMonetizationController();
  runApp(
    CloudTuneApp(
      playerController: playerController,
      offlineController: offlineController,
      monetizationController: monetizationController,
    ),
  );
}