import 'package:flutter/material.dart';
import '../../../app/navigation/app_routes.dart';

class NavigationHelpers {
  static Future<T?> navigateToScreen<T>(
    BuildContext context, {
    required String routeName,
    Object? arguments,
    bool replace = false,
  }) {
    if (replace) {
      return Navigator.of(context).pushReplacementNamed(
        routeName,
        arguments: arguments,
      );
    } else {
      return Navigator.of(context).pushNamed(
        routeName,
        arguments: arguments,
      );
    }
  }

  static void goToPlayerFull(BuildContext context) {
    navigateToScreen(context, routeName: AppRoutes.playerFull);
  }

  static void goToPremium(BuildContext context) {
    navigateToScreen(context, routeName: AppRoutes.premiumPlans);
  }

  static void goToUpload(BuildContext context) {
    navigateToScreen(context, routeName: AppRoutes.uploadMusic);
  }

  static void goToNotifications(BuildContext context) {
    navigateToScreen(context, routeName: AppRoutes.notifications);
  }

  static void goToPlaylists(BuildContext context) {
    navigateToScreen(context, routeName: AppRoutes.playlists);
  }

  static void goToFavorites(BuildContext context) {
    navigateToScreen(context, routeName: AppRoutes.favorites);
  }

  static void goToStorageManagement(BuildContext context) {
    navigateToScreen(context, routeName: AppRoutes.storageManagement);
  }

  static void goToSettings(BuildContext context) {
    navigateToScreen(context, routeName: AppRoutes.settings);
  }
}
