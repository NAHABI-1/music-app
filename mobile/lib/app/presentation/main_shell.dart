import 'package:flutter/material.dart';

import '../../core/utils/navigation_helpers.dart';
import '../../features/downloads/presentation/downloads_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/library/presentation/library_screen_new.dart';
import '../../features/player/presentation/player_mini_bar.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/search/presentation/search_screen.dart';
import '../application/app_flow_scope.dart';
import '../application/theme_mode_scope.dart';
import '../navigation/app_routes.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> with RestorationMixin {
  final RestorableInt _currentIndex = RestorableInt(0);

  static const _titles = ['Home', 'Search', 'Your Library', 'Downloads', 'Profile'];

  final _pages = [
    const HomeScreen(),
    const SearchScreen(),
    const LibraryScreen(),
    const DownloadsScreen(),
    const ProfileScreen(),
  ];

  @override
  String get restorationId => 'main_shell';

  @override
  void restoreState(RestorationBucket? oldBucket, bool initialRestore) {
    registerForRestoration(_currentIndex, 'main_shell_tab_index');
    _currentIndex.value = _clampIndex(_currentIndex.value);
  }

  int _clampIndex(int value) {
    return value.clamp(0, _pages.length - 1);
  }

  @override
  void dispose() {
    _currentIndex.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final selectedIndex = _clampIndex(_currentIndex.value);
    final themeModeController = ThemeModeScope.of(context);
    return AnimatedBuilder(
      animation: themeModeController,
      builder: (context, _) {
        return Scaffold(
          appBar: AppBar(
            title: Text(_titles[selectedIndex]),
            actions: [
              if (selectedIndex == 0) ...[
                IconButton(
                  tooltip: 'Upload music',
                  onPressed: () => NavigationHelpers.goToUpload(context),
                  icon: const Icon(Icons.upload_file_rounded),
                ),
              ],
              IconButton(
                tooltip: 'Notifications',
                onPressed: () => NavigationHelpers.goToNotifications(context),
                icon: const Icon(Icons.notifications_rounded),
              ),
              IconButton(
                tooltip: 'Premium plans',
                onPressed: () => NavigationHelpers.goToPremium(context),
                icon: const Icon(Icons.star_rounded),
              ),
              IconButton(
                tooltip: 'Settings',
                onPressed: () => NavigationHelpers.goToSettings(context),
                icon: const Icon(Icons.settings_rounded),
              ),
              IconButton(
                tooltip: 'Toggle light/dark mode',
                onPressed: themeModeController.toggleLightDark,
                icon: Icon(
                  themeModeController.themeMode == ThemeMode.dark
                      ? Icons.dark_mode_rounded
                      : Icons.light_mode_rounded,
                ),
              ),
              IconButton(
                tooltip: 'Sign out',
                onPressed: () {
                  AppFlowScope.of(context).logout();
                  Navigator.of(context).pushNamedAndRemoveUntil(AppRoutes.login, (route) => false);
                },
                icon: const Icon(Icons.logout_rounded),
              ),
            ],
          ),
          body: Column(
            children: [
              Expanded(
                child: IndexedStack(
                  index: selectedIndex,
                  children: _pages,
                ),
              ),
              const PlayerMiniBar(),
            ],
          ),
          bottomNavigationBar: NavigationBar(
            selectedIndex: selectedIndex,
            onDestinationSelected: (value) => setState(() => _currentIndex.value = _clampIndex(value)),
            destinations: const [
              NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
              NavigationDestination(icon: Icon(Icons.search_outlined), label: 'Search'),
              NavigationDestination(icon: Icon(Icons.library_music_outlined), label: 'Library'),
              NavigationDestination(icon: Icon(Icons.download_outlined), label: 'Downloads'),
              NavigationDestination(icon: Icon(Icons.person_outline_rounded), label: 'Profile'),
            ],
          ),
        );
      },
    );
  }
}
