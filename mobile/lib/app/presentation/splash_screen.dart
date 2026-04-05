import 'package:flutter/material.dart';

import '../../core/config/app_config.dart';
import '../application/app_flow_controller.dart';
import '../application/app_flow_scope.dart';
import '../navigation/app_routes.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  AppFlowController? _controller;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _controller ??= AppFlowScope.of(context)
      ..addListener(_onFlowChanged)
      ..bootstrap();
  }

  @override
  void dispose() {
    _controller?.removeListener(_onFlowChanged);
    super.dispose();
  }

  void _onFlowChanged() {
    if (!mounted || _controller == null) {
      return;
    }

    final route = switch (_controller!.stage) {
      AppFlowStage.splash => null,
      AppFlowStage.onboarding => AppRoutes.onboarding,
      AppFlowStage.auth => AppRoutes.login,
      AppFlowStage.authenticated => AppRoutes.main,
    };

    if (route != null) {
      Navigator.of(context).pushReplacementNamed(route);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 82,
              height: 82,
              decoration: BoxDecoration(
                color: theme.colorScheme.primary,
                borderRadius: BorderRadius.circular(22),
              ),
              child: Icon(
                Icons.graphic_eq_rounded,
                color: theme.colorScheme.onPrimary,
                size: 44,
              ),
            ),
            const SizedBox(height: 18),
            Text(AppConfig.appName, style: theme.textTheme.headlineSmall),
            const SizedBox(height: 6),
            Text('Tune in, anywhere', style: theme.textTheme.bodyMedium),
            const SizedBox(height: 18),
            const SizedBox(
              width: 26,
              height: 26,
              child: CircularProgressIndicator(strokeWidth: 2.4),
            ),
          ],
        ),
      ),
    );
  }
}
