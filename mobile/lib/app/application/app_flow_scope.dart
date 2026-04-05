import 'package:flutter/widgets.dart';

import 'app_flow_controller.dart';

class AppFlowScope extends InheritedNotifier<AppFlowController> {
  const AppFlowScope({
    super.key,
    required AppFlowController controller,
    required super.child,
  }) : super(notifier: controller);

  static AppFlowController of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AppFlowScope>();
    assert(scope != null, 'No AppFlowScope found in context.');
    return scope!.notifier!;
  }
}
