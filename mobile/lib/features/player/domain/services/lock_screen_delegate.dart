import '../models/playback_item.dart';

abstract class LockScreenDelegate {
  Future<void> updateNowPlaying({
    required PlaybackItem? item,
    required bool isPlaying,
    required Duration position,
    required Duration? duration,
  });
}
