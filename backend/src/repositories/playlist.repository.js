const { buildOwnedSongWhere } = require('./songOwnership');

class PlaylistRepository {
  constructor(prisma) {
    this.prisma = prisma || require('./prismaClient').prisma;
  }

  playlistListSelect() {
    return {
      id: true,
      userId: true,
      title: true,
      description: true,
      visibility: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          items: true,
        },
      },
    };
  }

  playlistDetailInclude() {
    return {
      items: {
        orderBy: {
          position: 'asc',
        },
        include: {
          song: {
            select: {
              id: true,
              title: true,
              durationSeconds: true,
              mimeType: true,
              status: true,
              rightsStatus: true,
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
            },
          },
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    };
  }

  async countUserPlaylists(userId) {
    return this.prisma.playlist.count({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });
  }

  async listUserPlaylists(userId, options) {
    const { skip, take } = options;
    return this.prisma.playlist.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      select: this.playlistListSelect(),
      skip,
      take,
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async createPlaylist(userId, input) {
    return this.prisma.playlist.create({
      data: {
        userId,
        title: input.title,
        description: input.description || null,
        visibility: 'PRIVATE',
        status: 'ACTIVE',
      },
      select: this.playlistListSelect(),
    });
  }

  async getUserPlaylistDetail(userId, playlistId) {
    return this.prisma.playlist.findFirst({
      where: {
        id: playlistId,
        userId,
        status: 'ACTIVE',
      },
      include: this.playlistDetailInclude(),
    });
  }

  async renamePlaylist(userId, playlistId, title) {
    return this.prisma.playlist.updateMany({
      where: {
        id: playlistId,
        userId,
        status: 'ACTIVE',
      },
      data: {
        title,
      },
    });
  }

  async deletePlaylist(userId, playlistId) {
    return this.prisma.playlist.updateMany({
      where: {
        id: playlistId,
        userId,
        status: 'ACTIVE',
      },
      data: {
        status: 'DELETED',
      },
    });
  }

  async findAccessibleSongForUser(userId, songId) {
    return this.prisma.song.findFirst({
      where: buildOwnedSongWhere(userId, { songId }),
      select: {
        id: true,
      },
    });
  }

  async getPlaylistItemBySong(playlistId, songId) {
    return this.prisma.playlistItem.findFirst({
      where: {
        playlistId,
        songId,
      },
      select: {
        id: true,
        position: true,
      },
    });
  }

  async addSongToPlaylist(playlistId, songId, addedByUserId, requestedPosition) {
    return this.prisma.$transaction(async (tx) => {
      const total = await tx.playlistItem.count({ where: { playlistId } });
      const targetPosition = requestedPosition
        ? Math.max(1, Math.min(requestedPosition, total + 1))
        : total + 1;

      await tx.playlistItem.updateMany({
        where: {
          playlistId,
          position: {
            gte: targetPosition,
          },
        },
        data: {
          position: {
            increment: 1,
          },
        },
      });

      return tx.playlistItem.create({
        data: {
          playlistId,
          songId,
          position: targetPosition,
          addedByUserId,
        },
        select: {
          id: true,
          playlistId: true,
          songId: true,
          position: true,
          addedAt: true,
        },
      });
    });
  }

  async removeSongFromPlaylist(playlistId, songId) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.playlistItem.findFirst({
        where: {
          playlistId,
          songId,
        },
        select: {
          id: true,
          position: true,
          songId: true,
        },
      });

      if (!existing) {
        return null;
      }

      await tx.playlistItem.delete({
        where: {
          id: existing.id,
        },
      });

      await tx.playlistItem.updateMany({
        where: {
          playlistId,
          position: {
            gt: existing.position,
          },
        },
        data: {
          position: {
            decrement: 1,
          },
        },
      });

      return existing;
    });
  }

  async listPlaylistItemIds(playlistId) {
    const items = await this.prisma.playlistItem.findMany({
      where: {
        playlistId,
      },
      select: {
        id: true,
      },
      orderBy: {
        position: 'asc',
      },
    });

    return items.map((item) => item.id);
  }

  async reorderPlaylistItems(playlistId, orderedItemIds) {
    return this.prisma.$transaction(async (tx) => {
      const offset = orderedItemIds.length + 10;

      for (let index = 0; index < orderedItemIds.length; index += 1) {
        await tx.playlistItem.updateMany({
          where: {
            id: orderedItemIds[index],
            playlistId,
          },
          data: {
            position: offset + index,
          },
        });
      }

      for (let index = 0; index < orderedItemIds.length; index += 1) {
        await tx.playlistItem.updateMany({
          where: {
            id: orderedItemIds[index],
            playlistId,
          },
          data: {
            position: index + 1,
          },
        });
      }
    });
  }
}

module.exports = {
  PlaylistRepository,
};
