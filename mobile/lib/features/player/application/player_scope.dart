import 'package:flutter/widgets.dart';

import 'player_controller.dart';

class PlayerScope extends InheritedNotifier<PlayerController> {
  const PlayerScope({
    super.key,
    required PlayerController controller,
    required super.child,
  }) : super(notifier: controller);

  static PlayerController of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<PlayerScope>();
    assert(scope != null, 'PlayerScope.of() called with no PlayerScope in context.');
    return scope!.notifier!;
  }
}
