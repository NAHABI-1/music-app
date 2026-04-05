import 'dart:convert';
import 'dart:io';

import '../../domain/repositories/playback_position_store.dart';

class FilePlaybackPositionStore implements PlaybackPositionStore {
  FilePlaybackPositionStore({File? file})
      : _file = file ?? File('${Directory.systemTemp.path}/cloudtune_playback_positions.json');

  final File _file;

  Future<Map<String, int>> _readAll() async {
    try {
      if (!await _file.exists()) {
        await _file.parent.create(recursive: true);
        await _file.writeAsString('{}', flush: true);
        return <String, int>{};
      }

      final raw = await _file.readAsString();
      if (raw.trim().isEmpty) {
        return <String, int>{};
      }

      final decoded = jsonDecode(raw);
      if (decoded is! Map<String, dynamic>) {
        return <String, int>{};
      }

      final parsed = <String, int>{};
      decoded.forEach((key, value) {
        if (value is num) {
          parsed[key] = value.toInt();
        }
      });
      return parsed;
    } on FormatException {
      return <String, int>{};
    } on FileSystemException {
      return <String, int>{};
    }
  }

  Future<void> _writeAll(Map<String, int> payload) async {
    await _file.parent.create(recursive: true);
    await _file.writeAsString(jsonEncode(payload), flush: true);
  }

  @override
  Future<void> clearLastPosition(String songId) async {
    final all = await _readAll();
    all.remove(songId);
    await _writeAll(all);
  }

  @override
  Future<Duration?> getLastPosition(String songId) async {
    final all = await _readAll();
    final ms = all[songId];
    if (ms == null) {
      return null;
    }
    return Duration(milliseconds: ms);
  }

  @override
  Future<void> saveLastPosition(String songId, Duration position) async {
    final all = await _readAll();
    all[songId] = position.inMilliseconds;
    await _writeAll(all);
  }
}
