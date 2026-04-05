const { LibraryRepository } = require('../../repositories/library.repository');
const { LibraryError } = require('./library.errors');

function mapSong(song) {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist ? { id: song.artist.id, name: song.artist.name, slug: song.artist.slug } : null,
    album: song.album ? { id: song.album.id, title: song.album.title, slug: song.album.slug } : null,
    durationSeconds: song.durationSeconds,
    mimeType: song.mimeType,
    status: song.status,
    rightsStatus: song.rightsStatus,
    uploadedByUserId: song.uploadedByUserId,
    createdAt: song.createdAt,
    updatedAt: song.updatedAt,
    metrics: {
      favorites: song._count?.favorites || 0,
      recentPlays: song._count?.recentPlays || 0,
      playlistItems: song._count?.playlistItems || 0,
    },
    favoritedAt: song.favoritedAt || null,
    recentPlayedAt: song.recentPlayedAt || null,
  };
}

class LibraryService {
  constructor({ repository = new LibraryRepository() } = {}) {
    this.repository = repository;
  }

  normalizePagination(query) {
    const page = Math.max(1, Number(query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize || 20)));
    return {
      page,
      pageSize,
      skip: (page - 1) * pageSize,
      take: pageSize,
    };
  }

  normalizeSearchTerm(value) {
    if (!value) {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }

  async listSongs(userId, query) {
    const { page, pageSize, skip, take } = this.normalizePagination(query);
    if (skip > 20_000) {
      throw new LibraryError(400, 'PAGINATION_WINDOW_EXCEEDED', 'Requested page is too deep. Narrow filters or lower page number.');
    }

    const searchTerm = this.normalizeSearchTerm(query.q);
    const sortOrder = query.sortOrder || 'desc';
    const sortBy = query.sortBy || 'createdAt';
    const filter = query.filter || 'all';

    if (filter === 'favorites') {
      const [total, songs] = await Promise.all([
        this.repository.countFavoriteSongs(userId, searchTerm),
        this.repository.listFavoriteSongs(userId, { skip, take, searchTerm, sortOrder }),
      ]);

      return {
        data: songs.map(mapSong),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      };
    }

    if (filter === 'recent') {
      const targetWindow = skip + take;
      const recentFetchLimit = Math.min(Math.max(targetWindow * 3, 300), 2500);
      const rows = await this.repository.listRecentPlays(userId, searchTerm, recentFetchLimit);
      const deduped = [];
      const seen = new Set();

      rows.forEach((row) => {
        if (row.song && !seen.has(row.songId)) {
          seen.add(row.songId);
          deduped.push({
            ...row.song,
            recentPlayedAt: row.playedAt,
          });
        }
      });

      const total = deduped.length;
      const paged = deduped.slice(skip, skip + take);

      return {
        data: paged.map(mapSong),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      };
    }

    if (filter === 'uploads') {
      const [total, songs] = await Promise.all([
        this.repository.countUploadedSongs(userId, searchTerm),
        this.repository.listUploadedSongs(userId, { skip, take, sortBy, sortOrder, searchTerm }),
      ]);

      return {
        data: songs.map(mapSong),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      };
    }

    const [total, songs] = await Promise.all([
      this.repository.countOwnedSongs(userId, searchTerm),
      this.repository.listOwnedSongs(userId, { skip, take, sortBy, sortOrder, searchTerm }),
    ]);

    return {
      data: songs.map(mapSong),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async searchSongs(userId, query) {
    return this.listSongs(userId, { ...query, filter: 'all' });
  }

  async searchCollections(userId, query) {
    const { page, pageSize, skip, take } = this.normalizePagination(query);
    const searchTerm = this.normalizeSearchTerm(query.q);
    const sortOrder = query.sortOrder || 'desc';

    const [artists, albums, playlists, artistTotal, albumTotal, playlistTotal] = await Promise.all([
      this.repository.searchArtists(userId, { skip, take, sortOrder, searchTerm }),
      this.repository.searchAlbums(userId, { skip, take, sortOrder, searchTerm }),
      this.repository.searchPlaylists(userId, { skip, take, sortOrder, searchTerm }),
      this.repository.countArtists(userId, searchTerm),
      this.repository.countAlbums(userId, searchTerm),
      this.repository.countPlaylists(userId, searchTerm),
    ]);

    return {
      data: {
        artists,
        albums,
        playlists,
      },
      pagination: {
        page,
        pageSize,
        totals: {
          artists: artistTotal,
          albums: albumTotal,
          playlists: playlistTotal,
        },
      },
    };
  }

  async getSongDetail(userId, songId) {
    const song = await this.repository.findOwnedSongById(userId, songId);
    if (!song) {
      throw new LibraryError(404, 'SONG_NOT_FOUND', 'Song was not found in your library.');
    }

    return {
      ...mapSong(song),
      latestUpload: song.uploads?.[0] || null,
    };
  }

  async getLibrarySummary(userId) {
    const [
      songsTotal,
      uploadedSongs,
      favoriteSongs,
      recentSongs,
      artistsCount,
      albumsCount,
      playlistsCount,
    ] = await Promise.all([
      this.repository.countOwnedSongs(userId),
      this.repository.countUploadedSongsSimple(userId),
      this.repository.countFavoriteSongsSimple(userId),
      this.repository.countRecentSongsSimple(userId),
      this.repository.countArtists(userId),
      this.repository.countAlbums(userId),
      this.repository.countPlaylists(userId),
    ]);

    return {
      songsTotal,
      uploadedSongs,
      favoriteSongs,
      recentSongs,
      artistsCount,
      albumsCount,
      playlistsCount,
    };
  }
}

function createLibraryService(dependencies) {
  return new LibraryService(dependencies);
}

module.exports = {
  LibraryService,
  createLibraryService,
};
