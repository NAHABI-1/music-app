import 'package:flutter/material.dart';

import '../core/config/app_config.dart';
import '../features/monetization/application/monetization_controller.dart';
import '../features/monetization/application/monetization_scope.dart';
import '../features/offline/application/offline_download_manager_controller.dart';
import '../features/offline/application/offline_scope.dart';
import '../features/player/application/player_controller.dart';
import '../features/player/application/player_scope.dart';
import 'application/app_flow_controller.dart';
import 'application/app_flow_scope.dart';
import 'application/theme_mode_controller.dart';
import 'application/theme_mode_scope.dart';
import 'navigation/app_router.dart';
import 'navigation/app_routes.dart';
import 'theme.dart';

class CloudTuneApp extends StatefulWidget {
  const CloudTuneApp({
    super.key,
    required this.playerController,
    required this.offlineController,
    required this.monetizationController,
  });

  final PlayerController playerController;
  final OfflineDownloadManagerController offlineController;
  final MonetizationController monetizationController;

  @override
  State<CloudTuneApp> createState() => _CloudTuneAppState();
}

class _CloudTuneAppState extends State<CloudTuneApp> {
  final _flowController = AppFlowController();
  final _themeModeController = ThemeModeController();

  @override
  void dispose() {
    _flowController.dispose();
    _themeModeController.dispose();
    widget.playerController.dispose();
    widget.offlineController.dispose();
    widget.monetizationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ThemeModeScope(
      controller: _themeModeController,
      child: AppFlowScope(
        controller: _flowController,
        child: MonetizationScope(
          controller: widget.monetizationController,
          child: OfflineScope(
            controller: widget.offlineController,
            child: PlayerScope(
              controller: widget.playerController,
              child: AnimatedBuilder(
                animation: _themeModeController,
                builder: (context, _) {
                  return MaterialApp(
                    debugShowCheckedModeBanner: false,
                    title: AppConfig.appName,
                    restorationScopeId: 'cloudtune_app',
                    theme: buildLightAppTheme(),
                    darkTheme: buildDarkAppTheme(),
                    themeMode: _themeModeController.themeMode,
                    initialRoute: AppRoutes.splash,
                    onGenerateRoute: onGenerateAppRoute,
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }
}
