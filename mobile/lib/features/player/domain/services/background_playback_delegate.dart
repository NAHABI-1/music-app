import '../models/playback_item.dart';

abstract class BackgroundPlaybackDelegate {
  Future<void> onSessionStarted({
    required String sessionId,
    required PlaybackItem item,
    required bool isPlaying,
  });

  Future<void> onPlaybackStateChanged({
    required String sessionId,
    required PlaybackItem? item,
    required bool isPlaying,
    required Duration position,
  });

  Future<void> onSessionEnded({
    required String sessionId,
    required PlaybackItem? item,
    required Duration position,
  });
}
