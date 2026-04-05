import 'dart:async';

import 'package:flutter_test/flutter_test.dart';

import 'package:cloudtune/features/player/application/player_controller.dart';
import 'package:cloudtune/features/player/domain/models/background_playback_config.dart';
import 'package:cloudtune/features/player/domain/models/playback_item.dart';
import 'package:cloudtune/features/player/domain/models/playback_quality.dart';
import 'package:cloudtune/features/player/domain/models/player_snapshot.dart';
import 'package:cloudtune/features/player/domain/models/repeat_mode.dart';
import 'package:cloudtune/features/player/domain/services/audio_service.dart';
import 'package:cloudtune/features/player/domain/services/background_playback_delegate.dart';
import 'package:cloudtune/features/player/domain/services/lock_screen_delegate.dart';
import 'package:cloudtune/features/player/domain/repositories/playback_position_store.dart';

class FakeAudioService implements AudioService {
  final StreamController<PlayerSnapshot> _controller =
      StreamController<PlayerSnapshot>.broadcast();

  int? currentIndex;
  bool isPlaying = false;
  Duration position = Duration.zero;
  Duration buffered = Duration.zero;
  Duration? duration;

  List<PlaybackItem> queue = const <PlaybackItem>[];

  void _emit() {
    _controller.add(
      PlayerSnapshot(
        currentIndex: currentIndex,
        isPlaying: isPlaying,
        position: position,
        bufferedPosition: buffered,
        duration: duration,
      ),
    );
  }

  @override
  Stream<PlayerSnapshot> get snapshots => _controller.stream;

  @override
  Future<void> configureBackgroundPlayback(BackgroundPlaybackConfig config) async {}

  @override
  Future<void> dispose() async {
    await _controller.close();
  }

  @override
  Future<void> initialize() async {
    _emit();
  }

  @override
  Future<void> next() async {
    if (currentIndex == null || queue.isEmpty || currentIndex! >= queue.length - 1) {
      return;
    }
    currentIndex = currentIndex! + 1;
    duration = queue[currentIndex!].duration;
    position = Duration.zero;
    buffered = Duration.zero;
    _emit();
  }

  @override
  Future<void> pause() async {
    isPlaying = false;
    _emit();
  }

  @override
  Future<void> play() async {
    isPlaying = true;
    _emit();
  }

  @override
  Future<void> previous() async {
    if (currentIndex == null || queue.isEmpty || currentIndex! <= 0) {
      return;
    }
    currentIndex = currentIndex! - 1;
    duration = queue[currentIndex!].duration;
    position = Duration.zero;
    buffered = Duration.zero;
    _emit();
  }

  @override
  Future<void> seek(Duration nextPosition) async {
    position = nextPosition;
    buffered = nextPosition;
    _emit();
  }

  @override
  Future<void> setQueue(
    List<PlaybackItem> nextQueue, {
    required int startIndex,
    required Duration startPosition,
  }) async {
    queue = List<PlaybackItem>.from(nextQueue);
    if (queue.isEmpty) {
      currentIndex = null;
      position = Duration.zero;
      buffered = Duration.zero;
      duration = null;
      isPlaying = false;
      _emit();
      return;
    }
    currentIndex = startIndex;
    duration = queue[startIndex].duration;
    position = startPosition;
    buffered = startPosition;
    _emit();
  }

  @override
  Future<void> setRepeatMode(RepeatMode mode) async {}

  @override
  Future<void> setShuffleEnabled(bool enabled) async {}
}

class MemoryPositionStore implements PlaybackPositionStore {
  final Map<String, Duration> _memory = <String, Duration>{};

  @override
  Future<void> clearLastPosition(String songId) async {
    _memory.remove(songId);
  }

  @override
  Future<Duration?> getLastPosition(String songId) async {
    return _memory[songId];
  }

  @override
  Future<void> saveLastPosition(String songId, Duration position) async {
    _memory[songId] = position;
  }
}

class NoopBackgroundDelegate implements BackgroundPlaybackDelegate {
  @override
  Future<void> onPlaybackStateChanged({
    required String sessionId,
    required PlaybackItem? item,
    required bool isPlaying,
    required Duration position,
  }) async {}

  @override
  Future<void> onSessionEnded({
    required String sessionId,
    required PlaybackItem? item,
    required Duration position,
  }) async {}

  @override
  Future<void> onSessionStarted({
    required String sessionId,
    required PlaybackItem item,
    required bool isPlaying,
  }) async {}
}

class RecordingBackgroundDelegate implements BackgroundPlaybackDelegate {
  int endedCount = 0;

  @override
  Future<void> onPlaybackStateChanged({
    required String sessionId,
    required PlaybackItem? item,
    required bool isPlaying,
    required Duration position,
  }) async {}

  @override
  Future<void> onSessionEnded({
    required String sessionId,
    required PlaybackItem? item,
    required Duration position,
  }) async {
    endedCount += 1;
  }

  @override
  Future<void> onSessionStarted({
    required String sessionId,
    required PlaybackItem item,
    required bool isPlaying,
  }) async {}
}

class NoopLockScreenDelegate implements LockScreenDelegate {
  @override
  Future<void> updateNowPlaying({
    required PlaybackItem? item,
    required bool isPlaying,
    required Duration position,
    required Duration? duration,
  }) async {}
}

List<PlaybackItem> queueFixture() {
  return const <PlaybackItem>[
    PlaybackItem(
      id: 'song-1',
      title: 'One',
      duration: Duration(minutes: 3),
    ),
    PlaybackItem(
      id: 'song-2',
      title: 'Two',
      duration: Duration(minutes: 4),
    ),
    PlaybackItem(
      id: 'song-3',
      title: 'Three',
      duration: Duration(minutes: 5),
    ),
  ];
}

Future<PlayerController> createController({
  FakeAudioService? audio,
  PlaybackPositionStore? store,
  BackgroundPlaybackDelegate? backgroundDelegate,
  LockScreenDelegate? lockScreenDelegate,
}) async {
  final controller = PlayerController(
    audioService: audio ?? FakeAudioService(),
    playbackPositionStore: store ?? MemoryPositionStore(),
    backgroundPlaybackDelegate: backgroundDelegate ?? NoopBackgroundDelegate(),
    lockScreenDelegate: lockScreenDelegate ?? NoopLockScreenDelegate(),
  );
  await controller.initialize();
  return controller;
}

void main() {
  test('setQueue initializes current item and autoplay state', () async {
    final controller = await createController();
    await controller.setQueue(queueFixture());

    expect(controller.state.currentItem?.id, 'song-1');
    expect(controller.state.isPlaying, true);
    expect(controller.state.queue.length, 3);
  });

  test('play and pause toggles playing state', () async {
    final controller = await createController();
    await controller.setQueue(queueFixture(), autoPlay: false);

    expect(controller.state.isPlaying, false);

    await controller.play();
    expect(controller.state.isPlaying, true);

    await controller.pause();
    expect(controller.state.isPlaying, false);
  });

  test('next and previous navigate queue', () async {
    final controller = await createController();
    await controller.setQueue(queueFixture());

    await controller.next();
    expect(controller.state.currentItem?.id, 'song-2');

    await controller.previous();
    expect(controller.state.currentItem?.id, 'song-1');
  });

  test('seek stores and resumes last position', () async {
    final store = MemoryPositionStore();
    final controller = await createController(store: store);
    await controller.setQueue(queueFixture());
    await controller.seek(const Duration(seconds: 45));
    await controller.pause();

    await controller.setQueue(queueFixture(), startIndex: 0);

    expect(controller.state.position, const Duration(seconds: 45));
  });

  test('repeat all wraps when next reaches queue end', () async {
    final controller = await createController();
    await controller.setQueue(queueFixture(), startIndex: 2);
    await controller.setRepeatMode(RepeatMode.all);

    await controller.next();

    expect(controller.state.currentItem?.id, 'song-1');
  });

  test('repeat one keeps same track on next', () async {
    final controller = await createController();
    await controller.setQueue(queueFixture(), startIndex: 1);
    await controller.setRepeatMode(RepeatMode.one);

    await controller.next();

    expect(controller.state.currentItem?.id, 'song-2');
    expect(controller.state.position, Duration.zero);
  });

  test('clearQueue ends background session scaffold and clears queue', () async {
    final background = RecordingBackgroundDelegate();
    final controller = await createController(backgroundDelegate: background);
    await controller.setQueue(queueFixture());

    await controller.clearQueue();

    expect(controller.state.queue, isEmpty);
    expect(controller.state.currentItem, isNull);
    expect(controller.state.sessionId, isNull);
    expect(background.endedCount, 1);
  });

  test('setLowDataMode updates reusable player state', () async {
    final controller = await createController();

    controller.setLowDataMode(true);

    expect(controller.state.lowDataMode, true);
  });

  test('setQuality updates reusable player state', () async {
    final controller = await createController();

    controller.setQuality(PlaybackQuality.high);

    expect(controller.state.quality, PlaybackQuality.high);
  });
}
