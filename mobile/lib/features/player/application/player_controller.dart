import 'dart:async';
import 'dart:math';

import 'package:flutter/foundation.dart';

import '../domain/models/background_playback_config.dart';
import '../domain/models/playback_item.dart';
import '../domain/models/playback_quality.dart';
import '../domain/models/player_snapshot.dart';
import '../domain/models/repeat_mode.dart';
import '../domain/repositories/playback_position_store.dart';
import '../domain/services/audio_service.dart';
import '../domain/services/background_playback_delegate.dart';
import '../domain/services/lock_screen_delegate.dart';
import 'player_state.dart';

class PlayerController extends ChangeNotifier {
  PlayerController({
    required AudioService audioService,
    required PlaybackPositionStore playbackPositionStore,
    required BackgroundPlaybackDelegate backgroundPlaybackDelegate,
    required LockScreenDelegate lockScreenDelegate,
  })  : _audioService = audioService,
        _playbackPositionStore = playbackPositionStore,
        _backgroundPlaybackDelegate = backgroundPlaybackDelegate,
        _lockScreenDelegate = lockScreenDelegate;

  final AudioService _audioService;
  final PlaybackPositionStore _playbackPositionStore;
  final BackgroundPlaybackDelegate _backgroundPlaybackDelegate;
  final LockScreenDelegate _lockScreenDelegate;

  final Random _random = Random();
  PlayerState _state = PlayerState.initial();
  PlayerState get state => _state;

  StreamSubscription<PlayerSnapshot>? _snapshotSubscription;

  Future<void> initialize() async {
    await _audioService.initialize();
    await _audioService.configureBackgroundPlayback(
      const BackgroundPlaybackConfig(
        androidNotificationChannelId: 'cloudtune_playback',
        androidNotificationChannelName: 'Playback',
        androidOngoingNotification: true,
        enableLockScreenControls: true,
      ),
    );

    _snapshotSubscription = _audioService.snapshots.listen((snapshot) {
      _state = _state.copyWith(
        currentIndex: snapshot.currentIndex,
        isPlaying: snapshot.isPlaying,
        position: snapshot.position,
        bufferedPosition: snapshot.bufferedPosition,
        duration: snapshot.duration,
        clearDuration: snapshot.duration == null,
      );
      notifyListeners();
      unawaited(_syncExternalPlaybackState());
    });
  }

  Future<void> setQueue(
    List<PlaybackItem> queue, {
    int startIndex = 0,
    bool autoPlay = true,
  }) async {
    if (queue.isEmpty) {
      _state = _state.copyWith(
        queue: const <PlaybackItem>[],
        clearCurrentIndex: true,
        position: Duration.zero,
        bufferedPosition: Duration.zero,
        isPlaying: false,
        clearDuration: true,
        clearSessionId: true,
      );
      notifyListeners();
      return;
    }

    final boundedIndex = startIndex.clamp(0, queue.length - 1);
    final item = queue[boundedIndex];
    final resume = await _playbackPositionStore.getLastPosition(item.id) ?? Duration.zero;

    _state = _state.copyWith(
      queue: List<PlaybackItem>.unmodifiable(queue),
      currentIndex: boundedIndex,
      position: resume,
      bufferedPosition: resume,
      duration: item.duration,
      sessionId: _newSessionId(),
    );
    notifyListeners();

    await _audioService.setQueue(
      queue,
      startIndex: boundedIndex,
      startPosition: resume,
    );

    await _backgroundPlaybackDelegate.onSessionStarted(
      sessionId: _state.sessionId!,
      item: item,
      isPlaying: autoPlay,
    );

    if (autoPlay) {
      await play();
    } else {
      await pause();
    }
  }

  Future<void> play() async {
    if (_state.currentItem == null) {
      return;
    }
    await _audioService.play();
  }

  Future<void> pause() async {
    await _audioService.pause();
    await _saveCurrentPosition();
  }

  Future<void> togglePlayPause() async {
    if (_state.isPlaying) {
      await pause();
      return;
    }
    await play();
  }

  Future<void> seek(Duration position) async {
    final item = _state.currentItem;
    if (item == null) {
      return;
    }

    final duration = _state.duration ?? item.duration;
    Duration safePosition = position;

    if (safePosition < Duration.zero) {
      safePosition = Duration.zero;
    }
    if (duration != null && safePosition > duration) {
      safePosition = duration;
    }

    await _audioService.seek(safePosition);
    await _playbackPositionStore.saveLastPosition(item.id, safePosition);
  }

  Future<void> next() async {
    final itemCount = _state.queue.length;
    final currentIndex = _state.currentIndex;

    if (itemCount == 0 || currentIndex == null) {
      return;
    }

    await _saveCurrentPosition();

    if (_state.repeatMode == RepeatMode.one) {
      await seek(Duration.zero);
      await play();
      return;
    }

    if (_state.shuffleEnabled && itemCount > 1) {
      int nextIndex = _random.nextInt(itemCount);
      while (nextIndex == currentIndex) {
        nextIndex = _random.nextInt(itemCount);
      }
      await skipToIndex(nextIndex);
      return;
    }

    if (currentIndex >= itemCount - 1) {
      if (_state.repeatMode == RepeatMode.all) {
        await skipToIndex(0);
      } else {
        await pause();
      }
      return;
    }

    await skipToIndex(currentIndex + 1);
  }

  Future<void> previous() async {
    final itemCount = _state.queue.length;
    final currentIndex = _state.currentIndex;

    if (itemCount == 0 || currentIndex == null) {
      return;
    }

    if (_state.position > const Duration(seconds: 3)) {
      await seek(Duration.zero);
      return;
    }

    await _saveCurrentPosition();

    if (_state.shuffleEnabled && itemCount > 1) {
      int previousIndex = _random.nextInt(itemCount);
      while (previousIndex == currentIndex) {
        previousIndex = _random.nextInt(itemCount);
      }
      await skipToIndex(previousIndex);
      return;
    }

    if (currentIndex <= 0) {
      if (_state.repeatMode == RepeatMode.all) {
        await skipToIndex(itemCount - 1);
      } else {
        await seek(Duration.zero);
      }
      return;
    }

    await skipToIndex(currentIndex - 1);
  }

  Future<void> skipToIndex(int index) async {
    if (_state.queue.isEmpty) {
      return;
    }

    final boundedIndex = index.clamp(0, _state.queue.length - 1);
    final item = _state.queue[boundedIndex];
    final resume = await _playbackPositionStore.getLastPosition(item.id) ?? Duration.zero;

    _state = _state.copyWith(
      currentIndex: boundedIndex,
      position: resume,
      bufferedPosition: resume,
      duration: item.duration,
    );
    notifyListeners();

    await _audioService.setQueue(
      _state.queue,
      startIndex: boundedIndex,
      startPosition: resume,
    );

    if (_state.isPlaying) {
      await _audioService.play();
    }
  }

  Future<void> setRepeatMode(RepeatMode mode) async {
    _state = _state.copyWith(repeatMode: mode);
    notifyListeners();
    await _audioService.setRepeatMode(mode);
  }

  Future<void> setShuffleEnabled(bool enabled) async {
    _state = _state.copyWith(shuffleEnabled: enabled);
    notifyListeners();
    await _audioService.setShuffleEnabled(enabled);
  }

  void setLowDataMode(bool enabled) {
    _state = _state.copyWith(lowDataMode: enabled);
    notifyListeners();
  }

  void setQuality(PlaybackQuality quality) {
    _state = _state.copyWith(quality: quality);
    notifyListeners();
  }

  Future<void> clearQueue() async {
    final sessionId = _state.sessionId;
    final item = _state.currentItem;
    final position = _state.position;

    await pause();
    await _audioService.setQueue(
      const <PlaybackItem>[],
      startIndex: 0,
      startPosition: Duration.zero,
    );

    if (sessionId != null) {
      await _backgroundPlaybackDelegate.onSessionEnded(
        sessionId: sessionId,
        item: item,
        position: position,
      );
    }

    _state = _state.copyWith(
      queue: const <PlaybackItem>[],
      clearCurrentIndex: true,
      position: Duration.zero,
      bufferedPosition: Duration.zero,
      clearDuration: true,
      clearSessionId: true,
    );
    notifyListeners();
  }

  Future<void> _saveCurrentPosition() async {
    final item = _state.currentItem;
    if (item == null) {
      return;
    }
    await _playbackPositionStore.saveLastPosition(item.id, _state.position);
  }

  Future<void> _syncExternalPlaybackState() async {
    await _lockScreenDelegate.updateNowPlaying(
      item: _state.currentItem,
      isPlaying: _state.isPlaying,
      position: _state.position,
      duration: _state.duration,
    );

    final sessionId = _state.sessionId;
    if (sessionId == null) {
      return;
    }

    if (!_state.isPlaying && _state.currentItem == null) {
      await _backgroundPlaybackDelegate.onSessionEnded(
        sessionId: sessionId,
        item: null,
        position: _state.position,
      );
      return;
    }

    await _backgroundPlaybackDelegate.onPlaybackStateChanged(
      sessionId: sessionId,
      item: _state.currentItem,
      isPlaying: _state.isPlaying,
      position: _state.position,
    );
  }

  String _newSessionId() {
    final now = DateTime.now().millisecondsSinceEpoch;
    final random = _random.nextInt(1 << 32);
    return 'session_${now}_$random';
  }

  @override
  void dispose() {
    unawaited(_snapshotSubscription?.cancel());
    unawaited(_audioService.dispose());
    super.dispose();
  }
}
