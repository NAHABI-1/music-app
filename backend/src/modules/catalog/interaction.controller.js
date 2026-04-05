const { createInteractionService } = require('./interaction.service');

function createInteractionController(service) {
  const interactionService = service || createInteractionService();

  return {
    likeSong: async (request, response, next) => {
      try {
        const payload = await interactionService.likeSong(request.auth.userId, request.validatedParams.songId);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    unlikeSong: async (request, response, next) => {
      try {
        const payload = await interactionService.unlikeSong(request.auth.userId, request.validatedParams.songId);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    listFavorites: async (request, response, next) => {
      try {
        const payload = await interactionService.listFavorites(request.auth.userId, request.validatedQuery);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    trackRecentlyPlayed: async (request, response, next) => {
      try {
        const payload = await interactionService.trackRecentlyPlayed(request.auth.userId, request.validatedBody);
        response.status(201).json(payload);
      } catch (error) {
        next(error);
      }
    },

    listRecentlyPlayed: async (request, response, next) => {
      try {
        const payload = await interactionService.listRecentlyPlayed(request.auth.userId, request.validatedQuery);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  createInteractionController,
};
