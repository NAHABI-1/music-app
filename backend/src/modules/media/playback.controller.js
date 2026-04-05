const { createPlaybackService } = require('./playback.service');

function createPlaybackController(service) {
  const playbackService = service || createPlaybackService();

  return {
    startSession: async (request, response, next) => {
      try {
        const payload = await playbackService.startPlaybackSession(request.auth.userId, request.validatedBody);
        response.status(201).json(payload);
      } catch (error) {
        next(error);
      }
    },

    getSession: async (request, response, next) => {
      try {
        const payload = await playbackService.getPlaybackSession(request.auth.userId, request.validatedParams.sessionId);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    updateProgress: async (request, response, next) => {
      try {
        const payload = await playbackService.updatePlaybackProgress(
          request.auth.userId,
          request.validatedParams.sessionId,
          request.validatedBody
        );
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    endSession: async (request, response, next) => {
      try {
        const payload = await playbackService.endPlaybackSession(
          request.auth.userId,
          request.validatedParams.sessionId,
          request.validatedBody
        );
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    getResume: async (request, response, next) => {
      try {
        const payload = await playbackService.getResumePosition(
          request.auth.userId,
          request.validatedParams.songId,
          request.validatedQuery
        );
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  createPlaybackController,
};
