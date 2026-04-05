const { buildOwnedSongWhere } = require('./songOwnership');

class OfflineRepository {
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
        status: true,
        rightsStatus: true,
      },
    });
  }

  async findActiveDeviceSession(userId, deviceSessionId) {
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

  async getCurrentSubscription(userId, now = new Date()) {
    return this.prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: ['ACTIVE', 'TRIALING'],
        },
        currentPeriodEnd: {
          gte: now,
        },
      },
      include: {
        plan: {
          select: {
            code: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        currentPeriodEnd: 'desc',
      },
    });
  }

  async countActiveOfflineDownloads(userId) {
    return this.prisma.offlineDownload.count({
      where: {
        userId,
        status: {
          in: ['QUEUED', 'DOWNLOADING', 'READY'],
        },
      },
    });
  }

  async getDownloadBySongAndDevice(userId, songId, deviceSessionId) {
    return this.prisma.offlineDownload.findFirst({
      where: {
        userId,
        songId,
        deviceSessionId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async createOfflineDownload(data) {
    return this.prisma.offlineDownload.create({
      data,
      select: {
        id: true,
        userId: true,
        songId: true,
        deviceSessionId: true,
        localPath: true,
        status: true,
        expiresAt: true,
        downloadedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateOfflineDownloadById(userId, downloadId, data) {
    return this.prisma.offlineDownload.updateMany({
      where: {
        id: downloadId,
        userId,
      },
      data,
    });
  }

  async getOfflineDownloadById(userId, downloadId) {
    return this.prisma.offlineDownload.findFirst({
      where: {
        id: downloadId,
        userId,
      },
      include: {
        song: {
          select: {
            id: true,
            title: true,
            durationSeconds: true,
          },
        },
        deviceSession: {
          select: {
            id: true,
            deviceId: true,
            platform: true,
          },
        },
      },
    });
  }

  async listOfflineDownloads(userId, options = {}) {
    return this.prisma.offlineDownload.findMany({
      where: {
        userId,
        ...(options.deviceSessionId ? { deviceSessionId: options.deviceSessionId } : {}),
        ...(options.status ? { status: options.status } : {}),
      },
      include: {
        song: {
          select: {
            id: true,
            title: true,
            durationSeconds: true,
          },
        },
        deviceSession: {
          select: {
            id: true,
            deviceId: true,
            platform: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findReadyEntitlement(userId, songId, deviceSessionId, now = new Date()) {
    return this.prisma.offlineDownload.findFirst({
      where: {
        userId,
        songId,
        deviceSessionId,
        status: 'READY',
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        song: {
          select: {
            id: true,
            title: true,
            durationSeconds: true,
          },
        },
      },
    });
  }

  async expireDownloads(userId, now = new Date()) {
    return this.prisma.offlineDownload.updateMany({
      where: {
        userId,
        status: {
          in: ['QUEUED', 'DOWNLOADING', 'READY'],
        },
        expiresAt: {
          lte: now,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });
  }
}

module.exports = {
  OfflineRepository,
};
