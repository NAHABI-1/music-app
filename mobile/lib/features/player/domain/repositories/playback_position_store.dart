abstract class PlaybackPositionStore {
  Future<Duration?> getLastPosition(String songId);

  Future<void> saveLastPosition(String songId, Duration position);

  Future<void> clearLastPosition(String songId);
}
