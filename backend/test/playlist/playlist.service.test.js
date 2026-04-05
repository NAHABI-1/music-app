const test = require('node:test');
const assert = require('node:assert/strict');

const { PlaylistService } = require('../../src/modules/catalog/playlist.service');
const { PlaylistError } = require('../../src/modules/catalog/playlist.errors');

function buildRepositoryMock() {
  return {
    countUserPlaylists: async () => 0,
    listUserPlaylists: async () => [],
    createPlaylist: async () => null,
    getUserPlaylistDetail: async () => null,
    renamePlaylist: async () => ({ count: 0 }),
    deletePlaylist: async () => ({ count: 0 }),
    findAccessibleSongForUser: async () => null,
    getPlaylistItemBySong: async () => null,
    addSongToPlaylist: async () => null,
    removeSongFromPlaylist: async () => null,
    listPlaylistItemIds: async () => [],
    reorderPlaylistItems: async () => undefined,
  };
}

function makePlaylist(overrides = {}) {
  return {
    id: 'playlist-1',
    userId: 'user-1',
    title: 'My Playlist',
    description: 'desc',
    visibility: 'PRIVATE',
    status: 'ACTIVE',
    createdAt: new Date('2026-04-05T00:00:00.000Z'),
    updatedAt: new Date('2026-04-05T00:00:00.000Z'),
    _count: { items: 2 },
    items: [
      {
        id: '11111111-1111-4111-8111-111111111111',
        songId: 'song-1',
        position: 1,
        addedAt: new Date('2026-04-05T00:00:00.000Z'),
        song: { id: 'song-1', title: 'Song 1' },
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        songId: 'song-2',
        position: 2,
        addedAt: new Date('2026-04-05T00:00:00.000Z'),
        song: { id: 'song-2', title: 'Song 2' },
      },
    ],
    ...overrides,
  };
}

test('createPlaylist returns normalized playlist', async () => {
  const repository = buildRepositoryMock();
  repository.createPlaylist = async () => makePlaylist({ items: [], _count: { items: 0 } });

  const service = new PlaylistService({ repository });
  const playlist = await service.createPlaylist('user-1', { title: 'New', description: 'desc' });

  assert.equal(playlist.title, 'My Playlist');
  assert.equal(playlist.itemsCount, 0);
});

test('addSongToPlaylist enforces song ownership visibility', async () => {
  const repository = buildRepositoryMock();
  repository.getUserPlaylistDetail = async () => makePlaylist();
  repository.findAccessibleSongForUser = async () => null;

  const service = new PlaylistService({ repository });

  await assert.rejects(
    () =>
      service.addSongToPlaylist('user-1', 'playlist-1', {
        songId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      }),
    (error) => error instanceof PlaylistError && error.code === 'SONG_NOT_FOUND'
  );
});

test('addSongToPlaylist rejects duplicate songs', async () => {
  const repository = buildRepositoryMock();
  repository.getUserPlaylistDetail = async () => makePlaylist();
  repository.findAccessibleSongForUser = async () => ({ id: 'song-1' });
  repository.getPlaylistItemBySong = async () => ({ id: 'item-1', position: 1 });

  const service = new PlaylistService({ repository });

  await assert.rejects(
    () =>
      service.addSongToPlaylist('user-1', 'playlist-1', {
        songId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      }),
    (error) => error instanceof PlaylistError && error.code === 'SONG_ALREADY_IN_PLAYLIST'
  );
});

test('reorderPlaylistItems validates full item set', async () => {
  const repository = buildRepositoryMock();
  repository.getUserPlaylistDetail = async () => makePlaylist();
  repository.listPlaylistItemIds = async () => [
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
  ];

  const service = new PlaylistService({ repository });

  await assert.rejects(
    () =>
      service.reorderPlaylistItems('user-1', 'playlist-1', {
        itemIds: ['11111111-1111-4111-8111-111111111111'],
      }),
    (error) => error instanceof PlaylistError && error.code === 'INVALID_REORDER_SET'
  );
});

test('listUserPlaylists returns paginated payload', async () => {
  const repository = buildRepositoryMock();
  repository.countUserPlaylists = async () => 1;
  repository.listUserPlaylists = async () => [makePlaylist({ items: [], _count: { items: 2 } })];

  const service = new PlaylistService({ repository });
  const result = await service.listUserPlaylists('user-1', { page: 1, pageSize: 10 });

  assert.equal(result.pagination.total, 1);
  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].itemsCount, 2);
});

test('getPlaylistDetail returns ordered items', async () => {
  const repository = buildRepositoryMock();
  repository.getUserPlaylistDetail = async () => makePlaylist();

  const service = new PlaylistService({ repository });
  const detail = await service.getPlaylistDetail('user-1', 'playlist-1');

  assert.equal(detail.items.length, 2);
  assert.equal(detail.items[0].position, 1);
});

test('listUserPlaylists rejects deep pagination window', async () => {
  const repository = buildRepositoryMock();
  const service = new PlaylistService({ repository });

  await assert.rejects(
    () => service.listUserPlaylists('user-1', { page: 1001, pageSize: 50 }),
    (error) => error instanceof PlaylistError && error.code === 'PAGINATION_WINDOW_EXCEEDED'
  );
});

test('removeSongFromPlaylist throws when song is not in playlist', async () => {
  const repository = buildRepositoryMock();
  repository.getUserPlaylistDetail = async () => makePlaylist();
  repository.removeSongFromPlaylist = async () => null;

  const service = new PlaylistService({ repository });

  await assert.rejects(
    () => service.removeSongFromPlaylist('user-1', 'playlist-1', 'song-404'),
    (error) => error instanceof PlaylistError && error.code === 'PLAYLIST_ITEM_NOT_FOUND'
  );
});
