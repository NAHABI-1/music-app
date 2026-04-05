import '../models/background_playback_config.dart';
import '../models/playback_item.dart';
import '../models/player_snapshot.dart';
import '../models/repeat_mode.dart';

abstract class AudioService {
  Stream<PlayerSnapshot> get snapshots;

  Future<void> initialize();

  Future<void> configureBackgroundPlayback(BackgroundPlaybackConfig config);

  Future<void> setQueue(
    List<PlaybackItem> queue, {
    required int startIndex,
    required Duration startPosition,
  });

  Future<void> play();

  Future<void> pause();

  Future<void> seek(Duration position);

  Future<void> next();

  Future<void> previous();

  Future<void> setShuffleEnabled(bool enabled);

  Future<void> setRepeatMode(RepeatMode mode);

  Future<void> dispose();
}
