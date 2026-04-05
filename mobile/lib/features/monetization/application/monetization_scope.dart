import 'package:flutter/widgets.dart';

import 'monetization_controller.dart';

class MonetizationScope extends InheritedNotifier<MonetizationController> {
  const MonetizationScope({
    super.key,
    required MonetizationController controller,
    required super.child,
  }) : super(notifier: controller);

  static MonetizationController of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<MonetizationScope>();
    assert(scope != null, 'MonetizationScope.of() called with no MonetizationScope in context.');
    return scope!.notifier!;
  }
}
