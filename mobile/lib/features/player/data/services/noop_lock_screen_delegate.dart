import '../../domain/models/playback_item.dart';
import '../../domain/services/lock_screen_delegate.dart';

class NoopLockScreenDelegate implements LockScreenDelegate {
  @override
  Future<void> updateNowPlaying({
    required PlaybackItem? item,
    required bool isPlaying,
    required Duration position,
    required Duration? duration,
  }) async {
    // Scaffold only: integrate with lock screen and notification transport controls.
  }
}
