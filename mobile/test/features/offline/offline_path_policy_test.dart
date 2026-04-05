import 'package:flutter_test/flutter_test.dart';

import 'package:cloudtune/features/offline/domain/services/offline_path_policy.dart';

void main() {
  test('sanitizes path components and builds cache paths', () {
    const policy = OfflinePathPolicy(rootPath: '/tmp/cloudtune_offline');

    expect(policy.sanitizeComponent('Song Name/2024'), 'Song_Name_2024');
    expect(
      policy.buildSongFilePath(
        songId: 'song 1',
        recordId: 'record 1',
        contentType: 'audio/mpeg',
      ),
      '/tmp/cloudtune_offline/files/song_1_record_1.mp3',
    );
    expect(policy.buildPartialFilePath(songId: 'song 1', recordId: 'record 1'),
        '/tmp/cloudtune_offline/partials/song_1_record_1.part');
  });
}
