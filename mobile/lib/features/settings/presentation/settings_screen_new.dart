import 'package:flutter/material.dart';
import '../../../shared/widgets/session_section.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notificationsEnabled = true;
  bool _offlineDownloads = true;
  bool _implicitContent = false;
  String _audioQuality = 'High';
  bool _showExplicit = true;
  bool _autoPlayNextSong = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            SessionSection(
              title: 'Playback',
              child: ListView(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  SwitchListTile(
                    title: const Text('Auto-Play Next Song'),
                    subtitle: const Text('Continue playing when queue ends'),
                    value: _autoPlayNextSong,
                    onChanged: (value) {
                      setState(() => _autoPlayNextSong = value);
                    },
                  ),
                  ListTile(
                    title: const Text('Audio Quality'),
                    subtitle: Text(_audioQuality),
                    trailing: PopupMenuButton(
                      onSelected: (value) {
                        setState(() => _audioQuality = value);
                      },
                      itemBuilder: (context) => [
                        const PopupMenuItem(value: 'Low', child: Text('Low')),
                        const PopupMenuItem(value: 'Normal', child: Text('Normal')),
                        const PopupMenuItem(
                            value: 'High', child: Text('High')),
                        const PopupMenuItem(
                            value: 'Very High', child: Text('Very High')),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            SessionSection(
              title: 'Downloads & Storage',
              child: ListView(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  SwitchListTile(
                    title: const Text('Offline Downloads'),
                    subtitle: const Text('Allow downloads for offline listening'),
                    value: _offlineDownloads,
                    onChanged: (value) {
                      setState(() => _offlineDownloads = value);
                    },
                  ),
                  ListTile(
                    title: const Text('Storage Usage'),
                    trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16),
                    onTap: () {},
                  ),
                  ListTile(
                    title: const Text('Clear Cache'),
                    subtitle: const Text('Free up storage space'),
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Cache cleared')),
                      );
                    },
                  ),
                ],
              ),
            ),
            SessionSection(
              title: 'Content',
              child: ListView(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  SwitchListTile(
                    title: const Text('Show Explicit Content'),
                    subtitle: const Text('Display songs marked as explicit'),
                    value: _showExplicit,
                    onChanged: (value) {
                      setState(() => _showExplicit = value);
                    },
                  ),
                ],
              ),
            ),
            SessionSection(
              title: 'Notifications',
              child: ListView(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  SwitchListTile(
                    title: const Text('Enable Notifications'),
                    subtitle: const Text('Get updates about new releases'),
                    value: _notificationsEnabled,
                    onChanged: (value) {
                      setState(() => _notificationsEnabled = value);
                    },
                  ),
                  SwitchListTile(
                    title: const Text('Implicit Content'),
                    subtitle: const Text('Receive alerts for new albums'),
                    value: _implicitContent,
                    enabled: _notificationsEnabled,
                    onChanged: (value) {
                      setState(() => _implicitContent = value);
                    },
                  ),
                ],
              ),
            ),
            SessionSection(
              title: 'About',
              showDivider: false,
              child: ListView(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  ListTile(
                    title: const Text('About CloudTune'),
                    trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16),
                    onTap: () {},
                  ),
                  ListTile(
                    title: const Text('Terms of Service'),
                    trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16),
                    onTap: () {},
                  ),
                  ListTile(
                    title: const Text('Privacy Policy'),
                    trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16),
                    onTap: () {},
                  ),
                  const ListTile(
                    title: Text('Version'),
                    subtitle: Text('1.0.0'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
