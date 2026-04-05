import 'package:flutter/material.dart';

import '../application/player_scope.dart';
import '../domain/models/playback_item.dart';
import '../domain/models/repeat_mode.dart';

class PlayerDebugControls extends StatelessWidget {
  const PlayerDebugControls({super.key});

  List<PlaybackItem> _demoQueue() {
    return const <PlaybackItem>[
      PlaybackItem(
        id: 'song-1',
        title: 'Neon Skyline',
        artist: 'CloudTune Demo',
        duration: Duration(minutes: 3, seconds: 12),
        streamUrl: 'https://example.com/stream/song-1',
      ),
      PlaybackItem(
        id: 'song-2',
        title: 'Drift Signal',
        artist: 'CloudTune Demo',
        duration: Duration(minutes: 2, seconds: 48),
        streamUrl: 'https://example.com/stream/song-2',
      ),
      PlaybackItem(
        id: 'song-3',
        title: 'Night Relay',
        artist: 'CloudTune Demo',
        duration: Duration(minutes: 4, seconds: 5),
        streamUrl: 'https://example.com/stream/song-3',
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final controller = PlayerScope.of(context);
    final state = controller.state;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        FilledButton.tonal(
          onPressed: () => controller.setQueue(_demoQueue()),
          child: const Text('Load Demo Queue'),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            OutlinedButton(
              onPressed: controller.togglePlayPause,
              child: Text(state.isPlaying ? 'Pause' : 'Play'),
            ),
            OutlinedButton(
              onPressed: state.hasPrevious ? controller.previous : null,
              child: const Text('Previous'),
            ),
            OutlinedButton(
              onPressed: state.hasNext ? controller.next : null,
              child: const Text('Next'),
            ),
            OutlinedButton(
              onPressed: () => controller.seek(
                state.position + const Duration(seconds: 15),
              ),
              child: const Text('Seek +15s'),
            ),
            OutlinedButton(
              onPressed: () => controller.setShuffleEnabled(!state.shuffleEnabled),
              child: Text(state.shuffleEnabled ? 'Shuffle On' : 'Shuffle Off'),
            ),
            OutlinedButton(
              onPressed: () {
                final nextMode = switch (state.repeatMode) {
                  RepeatMode.off => RepeatMode.all,
                  RepeatMode.all => RepeatMode.one,
                  RepeatMode.one => RepeatMode.off,
                };
                controller.setRepeatMode(nextMode);
              },
              child: Text('Repeat: ${state.repeatMode.name}'),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Text('Now Playing: ${state.currentItem?.title ?? 'None'}'),
        Text('Queue Size: ${state.queue.length}'),
        Text('Position: ${state.position.inSeconds}s'),
        Text('Session: ${state.sessionId ?? '-'}'),
      ],
    );
  }
}
