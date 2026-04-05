import 'package:flutter/material.dart';

import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/signup_screen.dart';
import '../../features/downloads/presentation/downloads_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/library/presentation/favorites_screen.dart';
import '../../features/library/presentation/library_screen_new.dart';
import '../../features/library/presentation/playlists_screen.dart';
import '../../features/library/presentation/song_details_screen.dart';
import '../../features/monetization/presentation/premium_plans_screen.dart';
import '../../features/notifications/presentation/notifications_screen.dart';
import '../../features/onboarding/presentation/onboarding_screen.dart';
import '../../features/player/presentation/player_screen_full.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/search/presentation/search_screen.dart';
import '../../features/settings/presentation/settings_screen_new.dart';
import '../../features/storage/presentation/storage_management_screen.dart';
import '../../features/uploads/presentation/upload_music_screen.dart';
import '../presentation/main_shell.dart';
import '../presentation/splash_screen.dart';
import 'app_routes.dart';

Route<dynamic> onGenerateAppRoute(RouteSettings settings) {
  switch (settings.name) {
    case AppRoutes.splash:
      return MaterialPageRoute<void>(
        settings: settings,
        builder: (_) => const SplashScreen(),
      );
    case AppRoutes.onboarding:
      return MaterialPageRoute<void>(
        settings: settings,
        builder: (_) => const OnboardingScreen(),
      );
    case AppRoutes.login:
      return MaterialPageRoute<void>(
        settings: settings,
        builder: (_) => const LoginScreen(),
      );
    case AppRoutes.signup:
      return MaterialPageRoute<void>(
        settings: settings,
        builder: (_) => const SignupScreen(),
      );
    case AppRoutes.main:
      return MaterialPageRoute<void>(
        settings: settings,
        builder: (_) => const MainShell(),
      );
    case AppRoutes.home:
      return MaterialPageRoute<void>(
        settings: settings,
        builder: (_) => const HomeScreen(),
      );
    case AppRoutes.search:
      return MaterialPageRoute<void>(
        settings: settings,
        builder: (_) => const SearchScreen(),
      );
    case AppRoutes.library:
      return MaterialPageRoute<void>(
        settings: settings,
        builder: (_) => const LibraryScreen(),
      );
    case AppRoutes.playlists:
      return MaterialPageRoute<void>(
        settings: settings,
        builder: (_) => const PlaylistsScreen(),
      );
    case AppRoutes.favorites:
      return MaterialPageRoute<void>(
        settings: settings,
        builder: (_) => const FavoritesScreen(),
      );
    case AppRoutes.songDetails:
      return MaterialPageRoute<void>(
        settings: settings,
        builder: (_) => SongDetailsScreen(
          song: (settings.arguments as Map)['song'],
        ),
      );
    case AppRoutes.playerFull:
      return MaterialPageRoute<void>(
        settings: settings,
        builder: (_) => const PlayerScreen(),
      );
    case AppRoutes.downloads:
      return MaterialPageRoute<void>(
        settings: settings,
        builder: (_) => const DownloadsScreen(),
      );
    case AppRoutes.uploadMusic:
      return MaterialPageRoute<void>(
        settings: settings,
        builder: (_) => const UploadMusicScreen(),
      );
    case AppRoutes.premiumPlans:
      return MaterialPageRoute<void>(
        settings: settings,
        builder: (_) => const PremiumPlansScreen(),
      );
    case AppRoutes.profile:
      return MaterialPageRoute<void>(
        settings: settings,
        builder: (_) => const ProfileScreen(),
      );
    case AppRoutes.settings:
      return MaterialPageRoute<void>(
        settings: settings,
        builder: (_) => const SettingsScreen(),
      );
    case AppRoutes.storageManagement:
      return MaterialPageRoute<void>(
        settings: settings,
        builder: (_) => const StorageManagementScreen(),
      );
    case AppRoutes.notifications:
      return MaterialPageRoute<void>(
        settings: settings,
        builder: (_) => const NotificationsScreen(),
      );
    default:
      return MaterialPageRoute<void>(
        settings: settings,
        builder: (_) => const _NotFoundScreen(),
      );
  }
}

class _NotFoundScreen extends StatelessWidget {
  const _NotFoundScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Route not found')),
      body: const Center(
        child: Text('The requested screen does not exist in this build.'),
      ),
    );
  }
}
