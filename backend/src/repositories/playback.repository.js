const { buildOwnedSongWhere } = require('./songOwnership');

class PlaybackRepository {
  constructor(prisma) {
    this.prisma = prisma || require('./prismaClient').prisma;
  }

  async findAccessibleReadySong(userId, songId) {
    return this.prisma.song.findFirst({
      where: {
        AND: [
          buildOwnedSongWhere(userId, { songId }),
          { status: 'READY' },
          { rightsStatus: { not: 'REJECTED' } },
        ],
      },
      select: {
        id: true,
        title: true,
        durationSeconds: true,
        mimeType: true,
        filePath: true,
        status: true,
        rightsStatus: true,
      },
    });
  }

  async findDeviceSessionForUser(userId, deviceSessionId) {
    return this.prisma.deviceSession.findFirst({
      where: {
        id: deviceSessionId,
        userId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        deviceId: true,
      },
    });
  }

  async createPlaybackSession(data) {
    return this.prisma.playbackSession.create({
      data,
      include: {
        song: {
          select: {
            id: true,
            title: true,
            durationSeconds: true,
            mimeType: true,
          },
        },
      },
    });
  }

  async getPlaybackSessionById(userId, sessionId) {
    return this.prisma.playbackSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      include: {
        song: {
          select: {
            id: true,
            title: true,
            durationSeconds: true,
            mimeType: true,
          },
        },
      },
    });
  }

  async updatePlaybackSessionById(userId, sessionId, data) {
    return this.prisma.playbackSession.updateMany({
      where: {
        id: sessionId,
        userId,
      },
      data,
    });
  }

  async getLatestSongSession(userId, songId) {
    return this.prisma.playbackSession.findFirst({
      where: {
        userId,
        songId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        status: true,
        lastPositionSecs: true,
        maxPositionSecs: true,
        updatedAt: true,
      },
    });
  }

  async createAnalyticsEvent(data) {
    return this.prisma.analyticsEvent.create({
      data,
    });
  }

  async createRecentPlay(data) {
    return this.prisma.recentPlay.create({
      data,
      select: {
        id: true,
      },
    });
  }
}

module.exports = {
  PlaybackRepository,
};
