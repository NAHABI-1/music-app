import 'dart:async';

import '../../domain/models/background_playback_config.dart';
import '../../domain/models/playback_item.dart';
import '../../domain/models/player_snapshot.dart';
import '../../domain/models/repeat_mode.dart';
import '../../domain/services/audio_service.dart';

class ScaffoldAudioService implements AudioService {
  final StreamController<PlayerSnapshot> _snapshotsController =
      StreamController<PlayerSnapshot>.broadcast();

  List<PlaybackItem> _queue = const <PlaybackItem>[];
  int? _currentIndex;
  bool _isPlaying = false;
  Duration _position = Duration.zero;
  Duration _bufferedPosition = Duration.zero;
  Duration? _duration;
  Timer? _ticker;

  void _startTicker() {
    _ticker?.cancel();
    _ticker = Timer.periodic(const Duration(milliseconds: 250), (_) {
      if (!_isPlaying || _currentIndex == null) {
        return;
      }

      final trackDuration = _duration;
      if (trackDuration == null) {
        return;
      }

      _position += const Duration(milliseconds: 250);
      final bufferedTarget = _position + const Duration(seconds: 4);
      _bufferedPosition = bufferedTarget > trackDuration ? trackDuration : bufferedTarget;

      if (_position >= trackDuration) {
        _position = trackDuration;
        _isPlaying = false;
        _stopTicker();
      }

      _emit();
    });
  }

  void _stopTicker() {
    _ticker?.cancel();
    _ticker = null;
  }

  @override
  Stream<PlayerSnapshot> get snapshots => _snapshotsController.stream;

  void _emit() {
    if (_snapshotsController.isClosed) {
      return;
    }
    _snapshotsController.add(
      PlayerSnapshot(
        currentIndex: _currentIndex,
        isPlaying: _isPlaying,
        position: _position,
        bufferedPosition: _bufferedPosition,
        duration: _duration,
      ),
    );
  }

  @override
  Future<void> initialize() async {
    _emit();
  }

  @override
  Future<void> configureBackgroundPlayback(BackgroundPlaybackConfig _config) async {
    // Scaffold only: integrate with platform background service plugin later.
  }

  @override
  Future<void> setQueue(
    List<PlaybackItem> queue, {
    required int startIndex,
    required Duration startPosition,
  }) async {
    _queue = List<PlaybackItem>.unmodifiable(queue);
    if (_queue.isEmpty) {
      _currentIndex = null;
      _position = Duration.zero;
      _bufferedPosition = Duration.zero;
      _duration = null;
      _isPlaying = false;
      _stopTicker();
      _emit();
      return;
    }

    final boundedIndex = startIndex.clamp(0, _queue.length - 1);
    _currentIndex = boundedIndex;
    _duration = _queue[boundedIndex].duration;
    _position = _clampPosition(startPosition, _duration);
    _bufferedPosition = _position;
    _emit();
  }

  @override
  Future<void> play() async {
    _isPlaying = true;
    _startTicker();
    _emit();
  }

  @override
  Future<void> pause() async {
    _isPlaying = false;
    _stopTicker();
    _emit();
  }

  @override
  Future<void> seek(Duration position) async {
    _position = _clampPosition(position, _duration);
    _bufferedPosition = _position;
    _emit();
  }

  @override
  Future<void> next() async {
    if (_queue.isEmpty || _currentIndex == null) {
      return;
    }

    final nextIndex = _currentIndex! + 1;
    if (nextIndex >= _queue.length) {
      return;
    }

    _currentIndex = nextIndex;
    _duration = _queue[nextIndex].duration;
    _position = Duration.zero;
    _bufferedPosition = Duration.zero;
    _emit();
  }

  @override
  Future<void> previous() async {
    if (_queue.isEmpty || _currentIndex == null) {
      return;
    }

    final previousIndex = _currentIndex! - 1;
    if (previousIndex < 0) {
      return;
    }

    _currentIndex = previousIndex;
    _duration = _queue[previousIndex].duration;
    _position = Duration.zero;
    _bufferedPosition = Duration.zero;
    _emit();
  }

  @override
  Future<void> setShuffleEnabled(bool _enabled) async {
    // Scaffold only: wire to engine-level shuffle once integrated.
  }

  @override
  Future<void> setRepeatMode(RepeatMode _mode) async {
    // Scaffold only: wire to engine-level repeat once integrated.
  }

  @override
  Future<void> dispose() async {
    _stopTicker();
    await _snapshotsController.close();
  }

  Duration _clampPosition(Duration value, Duration? trackDuration) {
    var bounded = value;
    if (bounded.isNegative) {
      bounded = Duration.zero;
    }
    if (trackDuration != null && bounded > trackDuration) {
      bounded = trackDuration;
    }
    return bounded;
  }
}
