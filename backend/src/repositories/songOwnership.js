function buildSongSearchOr(searchTerm) {
  if (!searchTerm) {
    return [];
  }

  return [
    { title: { contains: searchTerm, mode: 'insensitive' } },
    { artist: { name: { contains: searchTerm, mode: 'insensitive' } } },
    { album: { title: { contains: searchTerm, mode: 'insensitive' } } },
  ];
}

function buildOwnedSongWhere(userId, options = {}) {
  const { songId, searchTerm } = options;

  const ownershipOr = [
    { uploadedByUserId: userId },
    { favorites: { some: { userId } } },
    { recentPlays: { some: { userId } } },
    { playlistItems: { some: { playlist: { userId } } } },
  ];

  const where = {
    OR: ownershipOr,
  };

  if (songId) {
    where.id = songId;
  }

  const searchOr = buildSongSearchOr(searchTerm);
  if (searchOr.length) {
    return {
      AND: [where, { OR: searchOr }],
    };
  }

  return where;
}

module.exports = {
  buildSongSearchOr,
  buildOwnedSongWhere,
};
