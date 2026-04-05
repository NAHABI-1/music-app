const { createLibraryService } = require('./library.service');

function createLibraryController(service) {
  const libraryService = service || createLibraryService();

  return {
    listSongs: async (request, response, next) => {
      try {
        const payload = await libraryService.listSongs(request.auth.userId, request.validatedQuery);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    searchSongs: async (request, response, next) => {
      try {
        const payload = await libraryService.searchSongs(request.auth.userId, request.validatedQuery);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    searchCollections: async (request, response, next) => {
      try {
        const payload = await libraryService.searchCollections(request.auth.userId, request.validatedQuery);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    songDetail: async (request, response, next) => {
      try {
        const payload = await libraryService.getSongDetail(request.auth.userId, request.params.songId);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    summary: async (request, response, next) => {
      try {
        const payload = await libraryService.getLibrarySummary(request.auth.userId);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  createLibraryController,
};
