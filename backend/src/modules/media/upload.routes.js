const express = require('express');

const { requireAuth } = require('../auth/auth.middleware');
const { createUploadController } = require('./upload.controller');
const {
  initiateUploadSchema,
  updateUploadProgressSchema,
  completeUploadSchema,
  accessUrlSchema,
  validateBody,
} = require('./upload.schemas');

function createUploadRouter(options = {}) {
  const router = express.Router();
  const authGuard = options.requireAuth || requireAuth;
  const controller = options.controller || createUploadController();

  router.post('/', authGuard(), validateBody(initiateUploadSchema), controller.initiateUpload);
  router.get('/:uploadId', authGuard(), controller.getUpload);
  router.patch('/:uploadId/progress', authGuard(), validateBody(updateUploadProgressSchema), controller.updateProgress);
  router.post('/:uploadId/complete', authGuard(), validateBody(completeUploadSchema), controller.completeUpload);
  router.post('/:uploadId/access-url', authGuard(), validateBody(accessUrlSchema), controller.createAccessUrl);

  return router;
}

module.exports = {
  createUploadRouter,
};
