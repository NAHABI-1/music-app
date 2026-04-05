import '../domain/models/playback_item.dart';
import '../domain/models/playback_quality.dart';
import '../domain/models/repeat_mode.dart';

class PlayerState {
  const PlayerState({
    required this.queue,
    required this.currentIndex,
    required this.isPlaying,
    required this.position,
    required this.bufferedPosition,
    required this.duration,
    required this.repeatMode,
    required this.shuffleEnabled,
    required this.lowDataMode,
    required this.quality,
    required this.sessionId,
  });

  factory PlayerState.initial() {
    return const PlayerState(
      queue: <PlaybackItem>[],
      currentIndex: null,
      isPlaying: false,
      position: Duration.zero,
      bufferedPosition: Duration.zero,
      duration: null,
      repeatMode: RepeatMode.off,
      shuffleEnabled: false,
      lowDataMode: false,
      quality: PlaybackQuality.auto,
      sessionId: null,
    );
  }

  final List<PlaybackItem> queue;
  final int? currentIndex;
  final bool isPlaying;
  final Duration position;
  final Duration bufferedPosition;
  final Duration? duration;
  final RepeatMode repeatMode;
  final bool shuffleEnabled;
  final bool lowDataMode;
  final PlaybackQuality quality;
  final String? sessionId;

  PlaybackItem? get currentItem {
    if (currentIndex == null || currentIndex! < 0 || currentIndex! >= queue.length) {
      return null;
    }
    return queue[currentIndex!];
  }

  bool get hasNext {
    if (queue.isEmpty || currentIndex == null) {
      return false;
    }
    return currentIndex! < queue.length - 1;
  }

  bool get hasPrevious {
    if (queue.isEmpty || currentIndex == null) {
      return false;
    }
    return currentIndex! > 0;
  }

  PlayerState copyWith({
    List<PlaybackItem>? queue,
    int? currentIndex,
    bool clearCurrentIndex = false,
    bool? isPlaying,
    Duration? position,
    Duration? bufferedPosition,
    Duration? duration,
    bool clearDuration = false,
    RepeatMode? repeatMode,
    bool? shuffleEnabled,
    bool? lowDataMode,
    PlaybackQuality? quality,
    String? sessionId,
    bool clearSessionId = false,
  }) {
    return PlayerState(
      queue: queue ?? this.queue,
      currentIndex: clearCurrentIndex ? null : (currentIndex ?? this.currentIndex),
      isPlaying: isPlaying ?? this.isPlaying,
      position: position ?? this.position,
      bufferedPosition: bufferedPosition ?? this.bufferedPosition,
      duration: clearDuration ? null : (duration ?? this.duration),
      repeatMode: repeatMode ?? this.repeatMode,
      shuffleEnabled: shuffleEnabled ?? this.shuffleEnabled,
      lowDataMode: lowDataMode ?? this.lowDataMode,
      quality: quality ?? this.quality,
      sessionId: clearSessionId ? null : (sessionId ?? this.sessionId),
    );
  }
}
