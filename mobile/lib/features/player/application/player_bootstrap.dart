import 'dart:io';

import '../data/repositories/file_playback_position_store.dart';
import '../data/repositories/memory_playback_position_store.dart';
import '../data/services/noop_background_playback_delegate.dart';
import '../data/services/noop_lock_screen_delegate.dart';
import '../data/services/scaffold_audio_service.dart';
import 'player_controller.dart';

Future<PlayerController> createDefaultPlayerController() async {
  final playbackPositionStore = () {
    try {
      return FilePlaybackPositionStore(
        file: File('${Directory.systemTemp.path}/cloudtune/playback_positions.json'),
      );
    } catch (_) {
      return MemoryPlaybackPositionStore();
    }
  }();

  final controller = PlayerController(
    audioService: ScaffoldAudioService(),
    playbackPositionStore: playbackPositionStore,
    backgroundPlaybackDelegate: NoopBackgroundPlaybackDelegate(),
    lockScreenDelegate: NoopLockScreenDelegate(),
  );
  await controller.initialize();
  return controller;
}
