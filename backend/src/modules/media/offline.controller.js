const { createOfflineService } = require('./offline.service');

function createOfflineController(service) {
  const offlineService = service || createOfflineService();

  return {
    requestOfflineAccess: async (request, response, next) => {
      try {
        const payload = await offlineService.requestOfflineAccess(request.auth.userId, request.validatedBody);
        response.status(201).json(payload);
      } catch (error) {
        next(error);
      }
    },

    updateDownloadStatus: async (request, response, next) => {
      try {
        const payload = await offlineService.updateDownloadStatus(
          request.auth.userId,
          request.validatedParams.downloadId,
          request.validatedBody
        );
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    listDownloads: async (request, response, next) => {
      try {
        const payload = await offlineService.listDownloads(request.auth.userId, request.validatedQuery);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    validateEntitlement: async (request, response, next) => {
      try {
        const payload = await offlineService.validateEntitlement(
          request.auth.userId,
          request.validatedParams.songId,
          request.validatedQuery
        );
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    revokeDownload: async (request, response, next) => {
      try {
        const payload = await offlineService.revokeDownload(request.auth.userId, request.validatedParams.downloadId);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    expireDownloads: async (request, response, next) => {
      try {
        const payload = await offlineService.expireDownloads(request.auth.userId);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  createOfflineController,
};
