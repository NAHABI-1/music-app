import 'package:flutter/material.dart';

import '../../downloads/presentation/downloads_screen.dart';
import '../../library/presentation/library_screen.dart';
import '../../monetization/presentation/premium_plans_screen.dart';
import '../../player/presentation/player_mini_bar.dart';
import '../../settings/presentation/settings_screen.dart';
import '../../uploads/presentation/uploads_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int currentIndex = 0;

  final pages = const <Widget>[
    LibraryScreen(),
    UploadsScreen(),
    DownloadsScreen(),
    SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('CloudTune'),
        actions: [
          IconButton(
            tooltip: 'Premium',
            icon: const Icon(Icons.workspace_premium_outlined),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const PremiumPlansScreen(),
                ),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(child: pages[currentIndex]),
          const PlayerMiniBar(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (index) => setState(() => currentIndex = index),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.library_music_outlined), label: 'Library'),
          NavigationDestination(icon: Icon(Icons.upload_file_outlined), label: 'Uploads'),
          NavigationDestination(icon: Icon(Icons.download_outlined), label: 'Downloads'),
          NavigationDestination(icon: Icon(Icons.settings_outlined), label: 'Settings'),
        ],
      ),
    );
  }
}