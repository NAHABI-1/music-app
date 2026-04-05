const test = require('node:test');
const assert = require('node:assert/strict');

const { InteractionService } = require('../../src/modules/catalog/interaction.service');
const { InteractionError } = require('../../src/modules/catalog/interaction.errors');

function buildRepositoryMock() {
  return {
    findAccessibleSongForUser: async () => null,
    upsertFavorite: async () => null,
    removeFavorite: async () => ({ count: 0 }),
    countFavorites: async () => 0,
    listFavorites: async () => [],
    createRecentPlay: async () => null,
    countRecentPlays: async () => 0,
    listRecentPlays: async () => [],
  };
}

function makeSong(overrides = {}) {
  return {
    id: 'song-1',
    title: 'Song 1',
    durationSeconds: 120,
    mimeType: 'audio/mpeg',
    status: 'READY',
    rightsStatus: 'VERIFIED',
    createdAt: new Date('2026-04-05T00:00:00.000Z'),
    updatedAt: new Date('2026-04-05T00:00:00.000Z'),
    artist: { id: 'artist-1', name: 'Artist 1', slug: 'artist-1' },
    album: { id: 'album-1', title: 'Album 1', slug: 'album-1' },
    ...overrides,
  };
}

test('likeSong enforces ownership visibility', async () => {
  const repository = buildRepositoryMock();
  repository.findAccessibleSongForUser = async () => null;

  const service = new InteractionService({ repository });

  await assert.rejects(
    () => service.likeSong('user-1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
    (error) => error instanceof InteractionError && error.code === 'SONG_NOT_FOUND'
  );
});

test('likeSong creates favorite when song is accessible', async () => {
  const repository = buildRepositoryMock();
  repository.findAccessibleSongForUser = async () => makeSong();
  repository.upsertFavorite = async () => ({
    id: 'fav-1',
    songId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    createdAt: new Date('2026-04-05T01:00:00.000Z'),
  });

  const service = new InteractionService({ repository });
  const result = await service.likeSong('user-1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

  assert.equal(result.favorite.id, 'fav-1');
});

test('unlikeSong returns removed false when favorite does not exist', async () => {
  const repository = buildRepositoryMock();
  repository.removeFavorite = async () => ({ count: 0 });

  const service = new InteractionService({ repository });
  const result = await service.unlikeSong('user-1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

  assert.equal(result.removed, false);
});

test('unlikeSong returns removed true when favorite existed', async () => {
  const repository = buildRepositoryMock();
  repository.removeFavorite = async () => ({ count: 1 });

  const service = new InteractionService({ repository });
  const result = await service.unlikeSong('user-1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

  assert.equal(result.removed, true);
});

test('listFavorites returns paginated favorites', async () => {
  const repository = buildRepositoryMock();
  repository.countFavorites = async () => 1;
  repository.listFavorites = async () => [
    {
      id: 'fav-1',
      createdAt: new Date('2026-04-05T02:00:00.000Z'),
      song: makeSong(),
    },
  ];

  const service = new InteractionService({ repository });
  const result = await service.listFavorites('user-1', { page: 1, pageSize: 10 });

  assert.equal(result.pagination.total, 1);
  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].song.title, 'Song 1');
});

test('trackRecentlyPlayed enforces ownership visibility', async () => {
  const repository = buildRepositoryMock();
  repository.findAccessibleSongForUser = async () => null;

  const service = new InteractionService({ repository });

  await assert.rejects(
    () =>
      service.trackRecentlyPlayed('user-1', {
        songId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        playbackSource: 'STREAM',
      }),
    (error) => error instanceof InteractionError && error.code === 'SONG_NOT_FOUND'
  );
});

test('trackRecentlyPlayed creates playback row when song is accessible', async () => {
  const repository = buildRepositoryMock();
  repository.findAccessibleSongForUser = async () => makeSong();
  repository.createRecentPlay = async (_userId, songId, playbackSource, playDurationSecs) => ({
    id: 'recent-2',
    songId,
    playbackSource,
    playDurationSecs,
    playedAt: new Date('2026-04-05T04:00:00.000Z'),
  });

  const service = new InteractionService({ repository });
  const result = await service.trackRecentlyPlayed('user-1', {
    songId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    playbackSource: 'OFFLINE',
    playDurationSecs: 90,
  });

  assert.equal(result.recentPlay.id, 'recent-2');
  assert.equal(result.recentPlay.playbackSource, 'OFFLINE');
  assert.equal(result.recentPlay.playDurationSecs, 90);
});

test('listRecentlyPlayed returns paginated playback entries', async () => {
  const repository = buildRepositoryMock();
  repository.countRecentPlays = async () => 1;
  repository.listRecentPlays = async () => [
    {
      id: 'recent-1',
      playedAt: new Date('2026-04-05T03:00:00.000Z'),
      playbackSource: 'STREAM',
      playDurationSecs: 42,
      song: makeSong(),
    },
  ];

  const service = new InteractionService({ repository });
  const result = await service.listRecentlyPlayed('user-1', { page: 1, pageSize: 10 });

  assert.equal(result.pagination.total, 1);
  assert.equal(result.data[0].playbackSource, 'STREAM');
  assert.equal(result.data[0].song.id, 'song-1');
});
