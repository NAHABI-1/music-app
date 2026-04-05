import '../../domain/repositories/playback_position_store.dart';

class MemoryPlaybackPositionStore implements PlaybackPositionStore {
  final Map<String, Duration> _positionsBySongId = <String, Duration>{};

  @override
  Future<void> clearLastPosition(String songId) async {
    _positionsBySongId.remove(songId);
  }

  @override
  Future<Duration?> getLastPosition(String songId) async {
    return _positionsBySongId[songId];
  }

  @override
  Future<void> saveLastPosition(String songId, Duration position) async {
    _positionsBySongId[songId] = position;
  }
}
