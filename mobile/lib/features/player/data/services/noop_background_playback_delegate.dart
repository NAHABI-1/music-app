import '../../domain/models/playback_item.dart';
import '../../domain/services/background_playback_delegate.dart';

class NoopBackgroundPlaybackDelegate implements BackgroundPlaybackDelegate {
  @override
  Future<void> onSessionEnded({
    required String sessionId,
    required PlaybackItem? item,
    required Duration position,
  }) async {
    // Scaffold only: integrate with platform background playback session teardown.
  }

  @override
  Future<void> onSessionStarted({
    required String sessionId,
    required PlaybackItem item,
    required bool isPlaying,
  }) async {
    // Scaffold only: integrate with platform background playback registration.
  }

  @override
  Future<void> onPlaybackStateChanged({
    required String sessionId,
    required PlaybackItem? item,
    required bool isPlaying,
    required Duration position,
  }) async {
    // Scaffold only: integrate with platform background playback state updates.
  }
}
