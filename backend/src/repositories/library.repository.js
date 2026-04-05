const { buildSongSearchOr, buildOwnedSongWhere } = require('./songOwnership');

class LibraryRepository {
  constructor(prisma) {
    this.prisma = prisma || require('./prismaClient').prisma;
  }

  buildSongRelationSearch(searchTerm) {
    const songSearchOr = buildSongSearchOr(searchTerm);
    if (!songSearchOr.length) {
      return {};
    }

    return {
      song: {
        OR: songSearchOr,
      },
    };
  }

  buildOwnedSongWhere(userId, searchTerm) {
    return buildOwnedSongWhere(userId, { searchTerm });
  }

  songInclude() {
    return {
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
      _count: {
        select: {
          favorites: true,
          recentPlays: true,
          playlistItems: true,
        },
      },
    };
  }

  async countOwnedSongs(userId, searchTerm) {
    return this.prisma.song.count({
      where: this.buildOwnedSongWhere(userId, searchTerm),
    });
  }

  async listOwnedSongs(userId, options) {
    const { skip, take, sortBy, sortOrder, searchTerm } = options;
    return this.prisma.song.findMany({
      where: this.buildOwnedSongWhere(userId, searchTerm),
      include: this.songInclude(),
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });
  }

  async countUploadedSongs(userId, searchTerm) {
    const songSearchOr = buildSongSearchOr(searchTerm);
    return this.prisma.song.count({
      where: {
        uploadedByUserId: userId,
        ...(songSearchOr.length
          ? {
              OR: songSearchOr,
            }
          : {}),
      },
    });
  }

  async listUploadedSongs(userId, options) {
    const { skip, take, sortBy, sortOrder, searchTerm } = options;
    const songSearchOr = buildSongSearchOr(searchTerm);
    return this.prisma.song.findMany({
      where: {
        uploadedByUserId: userId,
        ...(songSearchOr.length
          ? {
              OR: songSearchOr,
            }
          : {}),
      },
      include: this.songInclude(),
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });
  }

  async listFavoriteSongs(userId, options) {
    const { skip, take, searchTerm, sortOrder } = options;
    const rows = await this.prisma.favorite.findMany({
      where: {
        userId,
        ...this.buildSongRelationSearch(searchTerm),
      },
      include: {
        song: {
          include: this.songInclude(),
        },
      },
      skip,
      take,
      orderBy: {
        createdAt: sortOrder,
      },
    });

    return rows.map((row) => ({
      ...row.song,
      favoritedAt: row.createdAt,
    }));
  }

  async countFavoriteSongs(userId, searchTerm) {
    return this.prisma.favorite.count({
      where: {
        userId,
        ...this.buildSongRelationSearch(searchTerm),
      },
    });
  }

  async listRecentPlays(userId, searchTerm, limit = 200) {
    return this.prisma.recentPlay.findMany({
      where: {
        userId,
        ...this.buildSongRelationSearch(searchTerm),
      },
      include: {
        song: {
          include: this.songInclude(),
        },
      },
      orderBy: {
        playedAt: 'desc',
      },
      take: limit,
    });
  }

  async findOwnedSongById(userId, songId) {
    return this.prisma.song.findFirst({
      where: buildOwnedSongWhere(userId, { songId }),
      include: {
        ...this.songInclude(),
        uploads: {
          where: { userId },
          select: {
            id: true,
            status: true,
            originalFilename: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async countArtists(userId, searchTerm) {
    return this.prisma.artist.count({
      where: {
        ...(searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : {}),
        OR: [
          { createdByUserId: userId },
          {
            songs: {
              some: {
                OR: [
                  { uploadedByUserId: userId },
                  { favorites: { some: { userId } } },
                  { recentPlays: { some: { userId } } },
                ],
              },
            },
          },
        ],
      },
    });
  }

  async searchArtists(userId, options) {
    const { skip, take, sortOrder, searchTerm } = options;
    return this.prisma.artist.findMany({
      where: {
        ...(searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : {}),
        OR: [
          { createdByUserId: userId },
          {
            songs: {
              some: {
                OR: [
                  { uploadedByUserId: userId },
                  { favorites: { some: { userId } } },
                  { recentPlays: { some: { userId } } },
                ],
              },
            },
          },
        ],
      },
      skip,
      take,
      orderBy: { name: sortOrder },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        _count: { select: { songs: true, albums: true } },
      },
    });
  }

  async countAlbums(userId, searchTerm) {
    return this.prisma.album.count({
      where: {
        ...(searchTerm ? { title: { contains: searchTerm, mode: 'insensitive' } } : {}),
        songs: {
          some: {
            OR: [
              { uploadedByUserId: userId },
              { favorites: { some: { userId } } },
              { recentPlays: { some: { userId } } },
            ],
          },
        },
      },
    });
  }

  async searchAlbums(userId, options) {
    const { skip, take, sortOrder, searchTerm } = options;
    return this.prisma.album.findMany({
      where: {
        ...(searchTerm ? { title: { contains: searchTerm, mode: 'insensitive' } } : {}),
        songs: {
          some: {
            OR: [
              { uploadedByUserId: userId },
              { favorites: { some: { userId } } },
              { recentPlays: { some: { userId } } },
            ],
          },
        },
      },
      include: {
        artist: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { songs: true },
        },
      },
      skip,
      take,
      orderBy: { title: sortOrder },
    });
  }

  async countPlaylists(userId, searchTerm) {
    return this.prisma.playlist.count({
      where: {
        userId,
        ...(searchTerm
          ? {
              OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
    });
  }

  async searchPlaylists(userId, options) {
    const { skip, take, sortOrder, searchTerm } = options;
    return this.prisma.playlist.findMany({
      where: {
        userId,
        ...(searchTerm
          ? {
              OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      skip,
      take,
      orderBy: { updatedAt: sortOrder },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
  }

  async countUploadedSongsSimple(userId) {
    return this.prisma.song.count({ where: { uploadedByUserId: userId } });
  }

  async countFavoriteSongsSimple(userId) {
    return this.prisma.favorite.count({ where: { userId } });
  }

  async countRecentSongsSimple(userId) {
    const grouped = await this.prisma.recentPlay.groupBy({
      by: ['songId'],
      where: { userId },
    });
    return grouped.length;
  }
}

module.exports = {
  LibraryRepository,
};
