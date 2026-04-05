import 'dart:async';

import 'package:flutter_test/flutter_test.dart';

import 'package:cloudtune/features/player/data/services/scaffold_audio_service.dart';
import 'package:cloudtune/features/player/domain/models/playback_item.dart';
import 'package:cloudtune/features/player/domain/models/player_snapshot.dart';

void main() {
  const queue = <PlaybackItem>[
    PlaybackItem(id: '1', title: 'Song 1', duration: Duration(seconds: 5)),
  ];

  test('setQueue clamps startPosition to track duration', () async {
    final service = ScaffoldAudioService();
    await service.initialize();

    final snapshots = <PlayerSnapshot>[];
    final sub = service.snapshots.listen(snapshots.add);

    await service.setQueue(
      queue,
      startIndex: 0,
      startPosition: const Duration(seconds: 9),
    );

    await Future<void>.delayed(const Duration(milliseconds: 20));
    final latest = snapshots.last;
    expect(latest.position, const Duration(seconds: 5));

    await sub.cancel();
    await service.dispose();
  });

  test('seek clamps negative position to zero', () async {
    final service = ScaffoldAudioService();
    await service.initialize();

    final snapshots = <PlayerSnapshot>[];
    final sub = service.snapshots.listen(snapshots.add);

    await service.setQueue(
      queue,
      startIndex: 0,
      startPosition: Duration.zero,
    );
    await service.seek(const Duration(seconds: -3));

    await Future<void>.delayed(const Duration(milliseconds: 20));
    final latest = snapshots.last;
    expect(latest.position, Duration.zero);

    await sub.cancel();
    await service.dispose();
  });

  test('playback stops at end of track', () async {
    final service = ScaffoldAudioService();
    await service.initialize();

    final snapshots = <PlayerSnapshot>[];
    final sub = service.snapshots.listen(snapshots.add);

    await service.setQueue(
      queue,
      startIndex: 0,
      startPosition: const Duration(seconds: 4, milliseconds: 900),
    );

    await service.play();
    await Future<void>.delayed(const Duration(milliseconds: 500));

    final latest = snapshots.last;
    expect(latest.position, const Duration(seconds: 5));
    expect(latest.isPlaying, false);

    await sub.cancel();
    await service.dispose();
  });
}
