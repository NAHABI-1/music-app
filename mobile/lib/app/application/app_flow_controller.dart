import 'dart:async';

import 'package:flutter/foundation.dart';

enum AppFlowStage {
  splash,
  onboarding,
  auth,
  authenticated,
}

class AppFlowController extends ChangeNotifier {
  AppFlowStage _stage = AppFlowStage.splash;
  bool _onboardingCompleted = false;

  AppFlowStage get stage => _stage;

  Future<void> bootstrap() async {
    if (_stage != AppFlowStage.splash) {
      return;
    }

    await Future<void>.delayed(const Duration(milliseconds: 1200));
    _stage = _onboardingCompleted ? AppFlowStage.auth : AppFlowStage.onboarding;
    notifyListeners();
  }

  void completeOnboarding() {
    _onboardingCompleted = true;
    _stage = AppFlowStage.auth;
    notifyListeners();
  }

  void login() {
    _stage = AppFlowStage.authenticated;
    notifyListeners();
  }

  void logout() {
    _stage = AppFlowStage.auth;
    notifyListeners();
  }
}
