const { InteractionRepository } = require('../../repositories/interaction.repository');
const { createAnalyticsTracker } = require('../../services/analyticsTracker');
const { InteractionError } = require('./interaction.errors');

function toSongDto(song) {
  return {
    id: song.id,
    title: song.title,
    durationSeconds: song.durationSeconds,
    mimeType: song.mimeType,
    status: song.status,
    rightsStatus: song.rightsStatus,
    createdAt: song.createdAt,
    updatedAt: song.updatedAt,
    artist: song.artist || null,
    album: song.album || null,
  };
}

class InteractionService {
  constructor({ repository = new InteractionRepository(), analyticsTracker = createAnalyticsTracker() } = {}) {
    this.repository = repository;
    this.analyticsTracker = analyticsTracker;
  }

  normalizePagination(query) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    return {
      page,
      pageSize,
      skip: (page - 1) * pageSize,
      take: pageSize,
    };
  }

  async likeSong(userId, songId) {
    const song = await this.repository.findAccessibleSongForUser(userId, songId);
    if (!song) {
      throw new InteractionError(404, 'SONG_NOT_FOUND', 'Song was not found in your library.');
    }

    const favorite = await this.repository.upsertFavorite(userId, songId);

    await this.analyticsTracker.trackEvent({
      userId,
      eventName: 'favorite_added',
      properties: {
        songId,
        favoriteId: favorite.id,
      },
    });

    return {
      favorite: {
        id: favorite.id,
        songId: favorite.songId,
        createdAt: favorite.createdAt,
      },
    };
  }

  async unlikeSong(userId, songId) {
    const result = await this.repository.removeFavorite(userId, songId);

    if (result.count > 0) {
      await this.analyticsTracker.trackEvent({
        userId,
        eventName: 'favorite_removed',
        properties: {
          songId,
        },
      });
    }

    return {
      removed: result.count > 0,
      songId,
    };
  }

  async listFavorites(userId, query) {
    const { page, pageSize, skip, take } = this.normalizePagination(query);

    const [total, rows] = await Promise.all([
      this.repository.countFavorites(userId),
      this.repository.listFavorites(userId, { skip, take }),
    ]);

    return {
      data: rows.map((row) => ({
        favoriteId: row.id,
        favoritedAt: row.createdAt,
        song: row.song ? toSongDto(row.song) : null,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async trackRecentlyPlayed(userId, input) {
    const song = await this.repository.findAccessibleSongForUser(userId, input.songId);
    if (!song) {
      throw new InteractionError(404, 'SONG_NOT_FOUND', 'Song was not found in your library.');
    }

    const recent = await this.repository.createRecentPlay(
      userId,
      input.songId,
      input.playbackSource || 'STREAM',
      input.playDurationSecs
    );

    return {
      recentPlay: recent,
    };
  }

  async listRecentlyPlayed(userId, query) {
    const { page, pageSize, skip, take } = this.normalizePagination(query);

    const [total, rows] = await Promise.all([
      this.repository.countRecentPlays(userId),
      this.repository.listRecentPlays(userId, { skip, take }),
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        playedAt: row.playedAt,
        playbackSource: row.playbackSource,
        playDurationSecs: row.playDurationSecs,
        song: row.song ? toSongDto(row.song) : null,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }
}

function createInteractionService(dependencies) {
  return new InteractionService(dependencies);
}

module.exports = {
  InteractionService,
  createInteractionService,
};
