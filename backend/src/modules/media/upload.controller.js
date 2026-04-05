const { createUploadService } = require('./upload.service');

function createUploadController(service) {
  const uploadService = service || createUploadService();

  return {
    initiateUpload: async (request, response, next) => {
      try {
        const payload = await uploadService.initiateUpload(request.auth.userId, request.validatedBody);
        response.status(201).json(payload);
      } catch (error) {
        next(error);
      }
    },

    getUpload: async (request, response, next) => {
      try {
        const payload = await uploadService.getUpload(request.auth.userId, request.params.uploadId);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    updateProgress: async (request, response, next) => {
      try {
        const payload = await uploadService.updateProgress(
          request.auth.userId,
          request.params.uploadId,
          request.validatedBody
        );
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    completeUpload: async (request, response, next) => {
      try {
        const payload = await uploadService.completeUpload(
          request.auth.userId,
          request.params.uploadId,
          request.validatedBody
        );
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    createAccessUrl: async (request, response, next) => {
      try {
        const payload = await uploadService.createAccessUrl(
          request.auth.userId,
          request.params.uploadId,
          request.validatedBody
        );
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  createUploadController,
};
