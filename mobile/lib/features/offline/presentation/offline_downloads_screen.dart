import 'package:flutter/material.dart';

import '../../../player/application/player_scope.dart';
import '../../../player/domain/models/playback_item.dart';
import '../application/offline_download_manager_controller.dart';
import '../application/offline_scope.dart';
import '../domain/models/offline_download_record.dart';
import '../domain/models/offline_download_state.dart';

class OfflineDownloadsScreen extends StatelessWidget {
  const OfflineDownloadsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = OfflineScope.of(context);
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final state = controller.state;
        return RefreshIndicator(
          onRefresh: controller.refresh,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _HeaderCard(
                isOnline: state.isOnline,
                isLoading: state.isLoading,
                lastMessage: state.lastMessage,
                lastSyncedAt: state.lastSyncedAt,
                onSync: controller.syncWithServer,
                onToggleConnectivity: () => controller.setOnline(!state.isOnline),
                onAddDemoDownload: () => controller.markSongForOffline(_demoItems.first),
              ),
              const SizedBox(height: 16),
              Text(
                'Downloaded Music',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              if (state.records.isEmpty)
                _EmptyState(onAddDemoDownload: () => controller.markSongForOffline(_demoItems.first))
              else
                ...state.records.map(
                  (record) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _DownloadTile(
                      record: record,
                      onPlay: () => _playOffline(context, controller, record),
                      onPause: () => controller.pauseDownload(record.songId),
                      onResume: () => controller.resumeDownload(record.songId),
                      onRetry: () => controller.retryDownload(record.songId),
                      onRemove: () => controller.removeDownload(record.songId),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  static void _playOffline(
    BuildContext context,
    OfflineDownloadManagerController controller,
    OfflineDownloadRecord record,
  ) {
    final item = controller.playbackItemForSongId(record.songId);
    if (item == null) {
      return;
    }
    final playerController = PlayerScope.of(context);
    playerController.setQueue(<PlaybackItem>[item], autoPlay: true);
  }
}

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({
    required this.isOnline,
    required this.isLoading,
    required this.lastMessage,
    required this.lastSyncedAt,
    required this.onSync,
    required this.onToggleConnectivity,
    required this.onAddDemoDownload,
  });

  final bool isOnline;
  final bool isLoading;
  final String? lastMessage;
  final DateTime? lastSyncedAt;
  final VoidCallback onSync;
  final VoidCallback onToggleConnectivity;
  final VoidCallback onAddDemoDownload;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Offline Cache', style: theme.textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              isLoading
                  ? 'Loading downloads...'
                  : isOnline
                      ? 'Online. Cached songs can stay available when the network drops.'
                      : 'Offline mode active. Only downloaded music is playable.',
            ),
            if (lastMessage != null) ...[
              const SizedBox(height: 8),
              Text(lastMessage!),
            ],
            if (lastSyncedAt != null) ...[
              const SizedBox(height: 8),
              Text('Last sync: ${lastSyncedAt!.toLocal()}'),
            ],
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 8,
              children: [
                FilledButton.icon(
                  onPressed: onAddDemoDownload,
                  icon: const Icon(Icons.download),
                  label: const Text('Mark demo song offline'),
                ),
                OutlinedButton.icon(
                  onPressed: onSync,
                  icon: const Icon(Icons.sync),
                  label: const Text('Sync'),
                ),
                TextButton.icon(
                  onPressed: onToggleConnectivity,
                  icon: Icon(isOnline ? Icons.cloud_off_outlined : Icons.cloud_queue_outlined),
                  label: Text(isOnline ? 'Go offline' : 'Go online'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DownloadTile extends StatelessWidget {
  const _DownloadTile({
    required this.record,
    required this.onPlay,
    required this.onPause,
    required this.onResume,
    required this.onRetry,
    required this.onRemove,
  });

  final OfflineDownloadRecord record;
  final VoidCallback onPlay;
  final VoidCallback onPause;
  final VoidCallback onResume;
  final VoidCallback onRetry;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final progress = record.progressPct.clamp(0, 100).toDouble() / 100;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(record.title, style: theme.textTheme.titleMedium),
                      if (record.artist != null) ...[
                        const SizedBox(height: 4),
                        Text(record.artist!),
                      ],
                      const SizedBox(height: 8),
                      Text(_statusText(record)),
                    ],
                  ),
                ),
                _StatusChip(record: record),
              ],
            ),
            const SizedBox(height: 12),
            LinearProgressIndicator(value: progress <= 0 ? null : progress),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                FilledButton.tonalIcon(
                  onPressed: record.canPlayOffline ? onPlay : null,
                  icon: const Icon(Icons.play_arrow),
                  label: const Text('Play'),
                ),
                OutlinedButton(
                  onPressed: record.state == OfflineDownloadState.downloading ? onPause : onResume,
                  child: Text(record.state == OfflineDownloadState.downloading ? 'Pause' : 'Resume'),
                ),
                TextButton(
                  onPressed: record.state == OfflineDownloadState.failed ? onRetry : null,
                  child: const Text('Retry'),
                ),
                TextButton(
                  onPressed: onRemove,
                  child: const Text('Remove'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _statusText(OfflineDownloadRecord record) {
    if (record.state == OfflineDownloadState.failed && record.errorMessage != null) {
      return record.errorMessage!;
    }
    if (record.canPlayOffline) {
      return 'Ready for offline playback';
    }
    return 'Progress ${record.progressPct}%';
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.record});

  final OfflineDownloadRecord record;

  @override
  Widget build(BuildContext context) {
    final label = switch (record.state) {
      OfflineDownloadState.queued => 'Queued',
      OfflineDownloadState.downloading => 'Downloading',
      OfflineDownloadState.paused => 'Paused',
      OfflineDownloadState.ready => 'Ready',
      OfflineDownloadState.failed => 'Failed',
      OfflineDownloadState.expired => 'Expired',
      OfflineDownloadState.revoked => 'Revoked',
    };

    return Chip(label: Text(label));
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onAddDemoDownload});

  final VoidCallback onAddDemoDownload;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Nothing saved yet', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            const Text('Download a song to keep it available when the connection drops.'),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onAddDemoDownload,
              icon: const Icon(Icons.download),
              label: const Text('Save a demo track'),
            ),
          ],
        ),
      ),
    );
  }
}

final List<PlaybackItem> _demoItems = <PlaybackItem>[
  PlaybackItem(
    id: 'demo-track-1',
    title: 'Night Drive',
    artist: 'CloudTune Sessions',
    streamUrl: 'https://example.com/audio/night-drive.mp3',
  ),
  PlaybackItem(
    id: 'demo-track-2',
    title: 'After Hours',
    artist: 'CloudTune Sessions',
    streamUrl: 'https://example.com/audio/after-hours.mp3',
  ),
];
