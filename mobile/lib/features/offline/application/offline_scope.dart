import 'package:flutter/widgets.dart';

import 'offline_download_manager_controller.dart';

class OfflineScope extends InheritedNotifier<OfflineDownloadManagerController> {
  const OfflineScope({
    super.key,
    required OfflineDownloadManagerController controller,
    required super.child,
  }) : super(notifier: controller);

  static OfflineDownloadManagerController of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<OfflineScope>();
    assert(scope != null, 'OfflineScope.of() called with no OfflineScope in context.');
    return scope!.notifier!;
  }
}
