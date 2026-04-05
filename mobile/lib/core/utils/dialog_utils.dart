import 'package:flutter/material.dart';

typedef AsyncCallback = Future<void> Function();

class DialogUtils {
  static Future<bool?> showConfirmDialog({
    required BuildContext context,
    required String title,
    required String message,
    String confirmLabel = 'Confirm',
    String cancelLabel = 'Cancel',
  }) {
    return showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(cancelLabel),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(confirmLabel),
          ),
        ],
      ),
    );
  }

  static Future<void> showLoadingDialog({
    required BuildContext context,
    required String message,
  }) {
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(message),
          ],
        ),
      ),
    );
  }

  static Future<void> showSuccessSnackbar({
    required BuildContext context,
    required String message,
    Duration duration = const Duration(seconds: 2),
  }) {
    return Future.delayed(Duration.zero, () {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: Colors.white),
              const SizedBox(width: 12),
              Expanded(child: Text(message)),
            ],
          ),
          backgroundColor: Colors.green,
          duration: duration,
        ),
      );
    });
  }

  static Future<void> showErrorSnackbar({
    required BuildContext context,
    required String message,
    Duration duration = const Duration(seconds: 3),
  }) {
    return Future.delayed(Duration.zero, () {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error_rounded, color: Colors.white),
              const SizedBox(width: 12),
              Expanded(child: Text(message)),
            ],
          ),
          backgroundColor: Colors.red,
          duration: duration,
        ),
      );
    });
  }

  static void showBottomSheet({
    required BuildContext context,
    required String title,
    required List<BottomSheetAction> actions,
  }) {
    showModalBottomSheet<void>(
      context: context,
      builder: (context) => Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 16),
            ...actions
                .map((action) => ListTile(
                      leading: Icon(action.icon),
                      title: Text(action.label),
                      onTap: () {
                        Navigator.pop(context);
                        action.onTap();
                      },
                    ))
                .toList(),
          ],
        ),
      ),
    );
  }
}

class BottomSheetAction {
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  BottomSheetAction({
    required this.label,
    required this.icon,
    required this.onTap,
  });
}
