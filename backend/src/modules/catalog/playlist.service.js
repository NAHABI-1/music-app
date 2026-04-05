const { PlaylistRepository } = require('../../repositories/playlist.repository');
const { createAnalyticsTracker } = require('../../services/analyticsTracker');
const { PlaylistError } = require('./playlist.errors');

function toPlaylistListDto(playlist) {
  return {
    id: playlist.id,
    userId: playlist.userId,
    title: playlist.title,
    description: playlist.description,
    visibility: playlist.visibility,
    status: playlist.status,
    itemsCount: playlist._count?.items || 0,
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
  };
}

function toPlaylistDetailDto(playlist) {
  return {
    id: playlist.id,
    userId: playlist.userId,
    title: playlist.title,
    description: playlist.description,
    visibility: playlist.visibility,
    status: playlist.status,
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
    itemsCount: playlist._count?.items || 0,
    items: (playlist.items || []).map((item) => ({
      id: item.id,
      songId: item.songId,
      position: item.position,
      addedAt: item.addedAt,
      song: item.song,
    })),
  };
}

class PlaylistService {
  constructor({ repository = new PlaylistRepository(), analyticsTracker = createAnalyticsTracker() } = {}) {
    this.repository = repository;
    this.analyticsTracker = analyticsTracker;
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

  async ensurePlaylistOwnership(userId, playlistId) {
    const playlist = await this.repository.getUserPlaylistDetail(userId, playlistId);
    if (!playlist) {
      throw new PlaylistError(404, 'PLAYLIST_NOT_FOUND', 'Playlist was not found.');
    }
    return playlist;
  }

  async createPlaylist(userId, input) {
    const playlist = await this.repository.createPlaylist(userId, input);
    await this.analyticsTracker.trackEvent({
      userId,
      eventName: 'playlist_created',
      properties: {
        playlistId: playlist.id,
        visibility: playlist.visibility,
      },
    });
    return toPlaylistListDto(playlist);
  }

  async renamePlaylist(userId, playlistId, input) {
    const updateResult = await this.repository.renamePlaylist(userId, playlistId, input.title);
    if (!updateResult || updateResult.count === 0) {
      throw new PlaylistError(404, 'PLAYLIST_NOT_FOUND', 'Playlist was not found.');
    }

    const detail = await this.repository.getUserPlaylistDetail(userId, playlistId);
    if (!detail) {
      throw new PlaylistError(404, 'PLAYLIST_NOT_FOUND', 'Playlist was not found.');
    }

    await this.analyticsTracker.trackEvent({
      userId,
      eventName: 'playlist_renamed',
      properties: {
        playlistId,
        title: input.title,
      },
    });

    return toPlaylistDetailDto(detail);
  }

  async deletePlaylist(userId, playlistId) {
    const result = await this.repository.deletePlaylist(userId, playlistId);
    if (!result || result.count === 0) {
      throw new PlaylistError(404, 'PLAYLIST_NOT_FOUND', 'Playlist was not found.');
    }

    await this.analyticsTracker.trackEvent({
      userId,
      eventName: 'playlist_deleted',
      properties: {
        playlistId,
      },
    });

    return {
      deleted: true,
      playlistId,
    };
  }

  async addSongToPlaylist(userId, playlistId, input) {
    await this.ensurePlaylistOwnership(userId, playlistId);

    const song = await this.repository.findAccessibleSongForUser(userId, input.songId);
    if (!song) {
      throw new PlaylistError(404, 'SONG_NOT_FOUND', 'Song was not found in your library.');
    }

    const existingItem = await this.repository.getPlaylistItemBySong(playlistId, input.songId);
    if (existingItem) {
      throw new PlaylistError(409, 'SONG_ALREADY_IN_PLAYLIST', 'Song already exists in this playlist.');
    }

    const item = await this.repository.addSongToPlaylist(playlistId, input.songId, userId, input.position);

    await this.analyticsTracker.trackEvent({
      userId,
      eventName: 'playlist_song_added',
      properties: {
        playlistId,
        songId: input.songId,
        playlistItemId: item.id,
      },
    });

    return {
      item,
    };
  }

  async removeSongFromPlaylist(userId, playlistId, songId) {
    await this.ensurePlaylistOwnership(userId, playlistId);

    const removedItem = await this.repository.removeSongFromPlaylist(playlistId, songId);
    if (!removedItem) {
      throw new PlaylistError(404, 'PLAYLIST_ITEM_NOT_FOUND', 'Song is not in this playlist.');
    }

    await this.analyticsTracker.trackEvent({
      userId,
      eventName: 'playlist_song_removed',
      properties: {
        playlistId,
        songId,
      },
    });

    return {
      removed: true,
      songId,
      playlistId,
    };
  }

  async reorderPlaylistItems(userId, playlistId, input) {
    await this.ensurePlaylistOwnership(userId, playlistId);

    const currentItemIds = await this.repository.listPlaylistItemIds(playlistId);
    if (currentItemIds.length !== input.itemIds.length) {
      throw new PlaylistError(
        400,
        'INVALID_REORDER_SET',
        'Reorder payload must include all current playlist item IDs exactly once.'
      );
    }

    const currentSet = new Set(currentItemIds);
    const providedSet = new Set(input.itemIds);
    if (currentSet.size !== providedSet.size) {
      throw new PlaylistError(
        400,
        'INVALID_REORDER_SET',
        'Reorder payload must include all current playlist item IDs exactly once.'
      );
    }

    for (const itemId of input.itemIds) {
      if (!currentSet.has(itemId)) {
        throw new PlaylistError(
          400,
          'INVALID_REORDER_SET',
          'Reorder payload must include all current playlist item IDs exactly once.'
        );
      }
    }

    await this.repository.reorderPlaylistItems(playlistId, input.itemIds);

    const detail = await this.repository.getUserPlaylistDetail(userId, playlistId);
    if (!detail) {
      throw new PlaylistError(404, 'PLAYLIST_NOT_FOUND', 'Playlist was not found.');
    }

    await this.analyticsTracker.trackEvent({
      userId,
      eventName: 'playlist_reordered',
      properties: {
        playlistId,
        itemCount: input.itemIds.length,
      },
    });

    return toPlaylistDetailDto(detail);
  }

  async listUserPlaylists(userId, query) {
    const { page, pageSize, skip, take } = this.normalizePagination(query);
    if (skip > 20_000) {
      throw new PlaylistError(400, 'PAGINATION_WINDOW_EXCEEDED', 'Requested page is too deep. Narrow filters or lower page number.');
    }
    const [total, playlists] = await Promise.all([
      this.repository.countUserPlaylists(userId),
      this.repository.listUserPlaylists(userId, { skip, take }),
    ]);

    return {
      data: playlists.map(toPlaylistListDto),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async getPlaylistDetail(userId, playlistId) {
    const detail = await this.repository.getUserPlaylistDetail(userId, playlistId);
    if (!detail) {
      throw new PlaylistError(404, 'PLAYLIST_NOT_FOUND', 'Playlist was not found.');
    }

    return toPlaylistDetailDto(detail);
  }
}

function createPlaylistService(dependencies) {
  return new PlaylistService(dependencies);
}

module.exports = {
  PlaylistService,
  createPlaylistService,
};
