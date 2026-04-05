const { createPlaylistService } = require('./playlist.service');

function createPlaylistController(service) {
  const playlistService = service || createPlaylistService();

  return {
    createPlaylist: async (request, response, next) => {
      try {
        const payload = await playlistService.createPlaylist(request.auth.userId, request.validatedBody);
        response.status(201).json(payload);
      } catch (error) {
        next(error);
      }
    },

    renamePlaylist: async (request, response, next) => {
      try {
        const payload = await playlistService.renamePlaylist(
          request.auth.userId,
          request.validatedParams.playlistId,
          request.validatedBody
        );
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    deletePlaylist: async (request, response, next) => {
      try {
        const payload = await playlistService.deletePlaylist(request.auth.userId, request.validatedParams.playlistId);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    addSongToPlaylist: async (request, response, next) => {
      try {
        const payload = await playlistService.addSongToPlaylist(
          request.auth.userId,
          request.validatedParams.playlistId,
          request.validatedBody
        );
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    removeSongFromPlaylist: async (request, response, next) => {
      try {
        const payload = await playlistService.removeSongFromPlaylist(
          request.auth.userId,
          request.validatedParams.playlistId,
          request.validatedParams.songId
        );
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    reorderPlaylistItems: async (request, response, next) => {
      try {
        const payload = await playlistService.reorderPlaylistItems(
          request.auth.userId,
          request.validatedParams.playlistId,
          request.validatedBody
        );
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    listUserPlaylists: async (request, response, next) => {
      try {
        const payload = await playlistService.listUserPlaylists(request.auth.userId, request.validatedQuery);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    getPlaylistDetail: async (request, response, next) => {
      try {
        const payload = await playlistService.getPlaylistDetail(request.auth.userId, request.validatedParams.playlistId);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  createPlaylistController,
};
