const { buildOwnedSongWhere } = require('./songOwnership');

class InteractionRepository {
  constructor(prisma) {
    this.prisma = prisma || require('./prismaClient').prisma;
  }

  songSelect() {
    return {
      id: true,
      title: true,
      durationSeconds: true,
      mimeType: true,
      status: true,
      rightsStatus: true,
      createdAt: true,
      updatedAt: true,
      artist: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      album: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    };
  }

  async findAccessibleSongForUser(userId, songId) {
    return this.prisma.song.findFirst({
      where: buildOwnedSongWhere(userId, { songId }),
      select: this.songSelect(),
    });
  }

  async upsertFavorite(userId, songId) {
    return this.prisma.favorite.upsert({
      where: {
        userId_songId: {
          userId,
          songId,
        },
      },
      update: {},
      create: {
        userId,
        songId,
      },
      select: {
        id: true,
        userId: true,
        songId: true,
        createdAt: true,
      },
    });
  }

  async removeFavorite(userId, songId) {
    return this.prisma.favorite.deleteMany({
      where: {
        userId,
        songId,
      },
    });
  }

  async countFavorites(userId) {
    return this.prisma.favorite.count({
      where: {
        userId,
      },
    });
  }

  async listFavorites(userId, options) {
    const { skip, take } = options;
    return this.prisma.favorite.findMany({
      where: {
        userId,
      },
      include: {
        song: {
          select: this.songSelect(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });
  }

  async createRecentPlay(userId, songId, playbackSource, playDurationSecs) {
    return this.prisma.recentPlay.create({
      data: {
        userId,
        songId,
        playbackSource,
        playDurationSecs: playDurationSecs ?? null,
      },
      select: {
        id: true,
        userId: true,
        songId: true,
        playbackSource: true,
        playDurationSecs: true,
        playedAt: true,
      },
    });
  }

  async countRecentPlays(userId) {
    return this.prisma.recentPlay.count({
      where: {
        userId,
      },
    });
  }

  async listRecentPlays(userId, options) {
    const { skip, take } = options;
    return this.prisma.recentPlay.findMany({
      where: {
        userId,
      },
      include: {
        song: {
          select: this.songSelect(),
        },
      },
      orderBy: {
        playedAt: 'desc',
      },
      skip,
      take,
    });
  }
}

module.exports = {
  InteractionRepository,
};
