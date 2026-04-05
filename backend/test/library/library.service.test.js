const test = require('node:test');
const assert = require('node:assert/strict');

const { LibraryService } = require('../../src/modules/catalog/library.service');
const { LibraryError } = require('../../src/modules/catalog/library.errors');

function buildRepositoryMock() {
  return {
    countOwnedSongs: async () => 0,
    listOwnedSongs: async () => [],
    countFavoriteSongs: async () => 0,
    listFavoriteSongs: async () => [],
    listRecentPlays: async () => [],
    countUploadedSongs: async () => 0,
    listUploadedSongs: async () => [],
    searchArtists: async () => [],
    searchAlbums: async () => [],
    searchPlaylists: async () => [],
    countArtists: async () => 0,
    countAlbums: async () => 0,
    countPlaylists: async () => 0,
    findOwnedSongById: async () => null,
    countUploadedSongsSimple: async () => 0,
    countFavoriteSongsSimple: async () => 0,
    countRecentSongsSimple: async () => 0,
  };
}

function makeSong(overrides = {}) {
  return {
    id: 'song-1',
    title: 'Song 1',
    artist: { id: 'artist-1', name: 'Artist 1', slug: 'artist-1' },
    album: { id: 'album-1', title: 'Album 1', slug: 'album-1' },
    durationSeconds: 180,
    mimeType: 'audio/mpeg',
    status: 'READY',
    rightsStatus: 'VERIFIED',
    uploadedByUserId: 'user-1',
    createdAt: new Date('2026-04-05T00:00:00.000Z'),
    updatedAt: new Date('2026-04-05T00:00:00.000Z'),
    _count: { favorites: 1, recentPlays: 2, playlistItems: 3 },
    ...overrides,
  };
}

test('listSongs returns paginated default listing', async () => {
  const repository = buildRepositoryMock();
  repository.countOwnedSongs = async () => 2;
  repository.listOwnedSongs = async () => [makeSong(), makeSong({ id: 'song-2', title: 'Song 2' })];

  const service = new LibraryService({ repository });
  const result = await service.listSongs('user-1', { page: 1, pageSize: 10, sortBy: 'createdAt', sortOrder: 'desc' });

  assert.equal(result.pagination.total, 2);
  assert.equal(result.data.length, 2);
  assert.equal(result.data[0].metrics.favorites, 1);
});

test('listSongs supports favorites filter', async () => {
  const repository = buildRepositoryMock();
  repository.countFavoriteSongs = async () => 1;
  repository.listFavoriteSongs = async () => [makeSong({ favoritedAt: new Date('2026-04-05T01:00:00.000Z') })];

  const service = new LibraryService({ repository });
  const result = await service.listSongs('user-1', { filter: 'favorites', page: 1, pageSize: 10, sortOrder: 'desc' });

  assert.equal(result.pagination.total, 1);
  assert.equal(result.data[0].id, 'song-1');
});

test('listSongs recent filter increases fetch window for deeper pages', async () => {
  const repository = buildRepositoryMock();
  let receivedLimit = 0;
  repository.listRecentPlays = async (_userId, _searchTerm, limit) => {
    receivedLimit = limit;
    return [];
  };

  const service = new LibraryService({ repository });
  const result = await service.listSongs('user-1', {
    filter: 'recent',
    page: 30,
    pageSize: 50,
    sortOrder: 'desc',
  });

  assert.equal(receivedLimit, 2500);
  assert.equal(result.pagination.total, 0);
});

test('searchCollections returns grouped payload and totals', async () => {
  const repository = buildRepositoryMock();
  repository.searchArtists = async () => [{ id: 'artist-1', name: 'Artist 1' }];
  repository.searchAlbums = async () => [{ id: 'album-1', title: 'Album 1' }];
  repository.searchPlaylists = async () => [{ id: 'playlist-1', title: 'Playlist 1' }];
  repository.countArtists = async () => 1;
  repository.countAlbums = async () => 1;
  repository.countPlaylists = async () => 1;

  const service = new LibraryService({ repository });
  const result = await service.searchCollections('user-1', {
    q: 'a',
    page: 1,
    pageSize: 10,
    sortOrder: 'desc',
  });

  assert.equal(result.data.artists.length, 1);
  assert.equal(result.data.albums.length, 1);
  assert.equal(result.data.playlists.length, 1);
  assert.equal(result.pagination.totals.artists, 1);
});

test('getSongDetail throws SONG_NOT_FOUND for missing ownership', async () => {
  const repository = buildRepositoryMock();
  repository.findOwnedSongById = async () => null;

  const service = new LibraryService({ repository });

  await assert.rejects(
    () => service.getSongDetail('user-1', 'song-404'),
    (error) => error instanceof LibraryError && error.code === 'SONG_NOT_FOUND'
  );
});

test('getLibrarySummary returns all summary metrics', async () => {
  const repository = buildRepositoryMock();
  repository.countOwnedSongs = async () => 15;
  repository.countUploadedSongsSimple = async () => 8;
  repository.countFavoriteSongsSimple = async () => 4;
  repository.countRecentSongsSimple = async () => 6;
  repository.countArtists = async () => 3;
  repository.countAlbums = async () => 5;
  repository.countPlaylists = async () => 2;

  const service = new LibraryService({ repository });
  const summary = await service.getLibrarySummary('user-1');

  assert.equal(summary.songsTotal, 15);
  assert.equal(summary.uploadedSongs, 8);
  assert.equal(summary.favoriteSongs, 4);
  assert.equal(summary.recentSongs, 6);
  assert.equal(summary.artistsCount, 3);
  assert.equal(summary.albumsCount, 5);
  assert.equal(summary.playlistsCount, 2);
});

test('listSongs rejects deep pagination window', async () => {
  const repository = buildRepositoryMock();
  const service = new LibraryService({ repository });

  await assert.rejects(
    () => service.listSongs('user-1', { page: 1001, pageSize: 50 }),
    (error) => error instanceof LibraryError && error.code === 'PAGINATION_WINDOW_EXCEEDED'
  );
});

test('searchSongs normalizes whitespace-only query to undefined search term', async () => {
  const repository = buildRepositoryMock();
  let receivedSearchTerm;
  repository.countOwnedSongs = async (_userId, searchTerm) => {
    receivedSearchTerm = searchTerm;
    return 0;
  };

  const service = new LibraryService({ repository });
  await service.searchSongs('user-1', { q: '   ', page: 1, pageSize: 20 });

  assert.equal(receivedSearchTerm, undefined);
});
