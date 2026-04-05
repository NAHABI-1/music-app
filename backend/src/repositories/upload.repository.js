class UploadRepository {
  constructor(prisma) {
    this.prisma = prisma || require('./prismaClient').prisma;
  }

  async createUpload(data) {
    return this.prisma.upload.create({ data });
  }

  async getUploadById(uploadId) {
    return this.prisma.upload.findUnique({
      where: { id: uploadId },
      include: {
        song: {
          select: {
            id: true,
            title: true,
            uploadedByUserId: true,
            status: true,
            rightsStatus: true,
            mimeType: true,
          },
        },
      },
    });
  }

  async updateUpload(uploadId, data) {
    return this.prisma.upload.update({
      where: { id: uploadId },
      data,
      include: {
        song: {
          select: {
            id: true,
            title: true,
            uploadedByUserId: true,
            status: true,
            rightsStatus: true,
            mimeType: true,
          },
        },
      },
    });
  }

  async getOrCreateArtistForUser(userId, artistName) {
    const baseName = (artistName || 'Independent Artist').trim();
    const safe = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 120) || 'artist';
    const slug = `u-${userId.slice(0, 8)}-${safe}`;

    const existing = await this.prisma.artist.findUnique({ where: { slug } });
    if (existing) {
      return existing;
    }

    return this.prisma.artist.create({
      data: {
        name: baseName,
        slug,
        status: 'ACTIVE',
        createdByUserId: userId,
      },
    });
  }

  async createSongFromUpload(data) {
    return this.prisma.song.create({
      data,
      select: {
        id: true,
        title: true,
        uploadedByUserId: true,
        status: true,
        rightsStatus: true,
        mimeType: true,
        fileSizeBytes: true,
      },
    });
  }

  async incrementStorageUsage(userId, bytes) {
    const snapshotDate = new Date();
    snapshotDate.setHours(0, 0, 0, 0);

    await this.prisma.storageUsage.upsert({
      where: {
        userId_snapshotDate: {
          userId,
          snapshotDate,
        },
      },
      update: {
        totalBytes: {
          increment: BigInt(bytes),
        },
        uploadedBytes: {
          increment: BigInt(bytes),
        },
      },
      create: {
        userId,
        snapshotDate,
        totalBytes: BigInt(bytes),
        uploadedBytes: BigInt(bytes),
        cachedBytes: BigInt(0),
        downloadedBytes: BigInt(0),
      },
    });
  }
}

module.exports = {
  UploadRepository,
};
