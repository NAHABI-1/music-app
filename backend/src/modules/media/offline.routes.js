const express = require('express');

const { requireAuth } = require('../auth/auth.middleware');
const { createOfflineController } = require('./offline.controller');
const {
  validateBody,
  validateQuery,
  validateParams,
  requestOfflineAccessSchema,
  updateOfflineDownloadStatusSchema,
  songEntitlementParamsSchema,
  downloadParamsSchema,
  entitlementQuerySchema,
  listDownloadsQuerySchema,
} = require('./offline.schemas');

function createOfflineRouter(options = {}) {
  const router = express.Router();
  const authGuard = options.requireAuth || requireAuth;
  const controller = options.controller || createOfflineController();

  router.post('/requests', authGuard(), validateBody(requestOfflineAccessSchema), controller.requestOfflineAccess);
  router.patch(
    '/downloads/:downloadId/status',
    authGuard(),
    validateParams(downloadParamsSchema),
    validateBody(updateOfflineDownloadStatusSchema),
    controller.updateDownloadStatus
  );
  router.get('/downloads', authGuard(), validateQuery(listDownloadsQuerySchema), controller.listDownloads);
  router.get(
    '/entitlements/:songId',
    authGuard(),
    validateParams(songEntitlementParamsSchema),
    validateQuery(entitlementQuerySchema),
    controller.validateEntitlement
  );
  router.delete('/downloads/:downloadId', authGuard(), validateParams(downloadParamsSchema), controller.revokeDownload);
  router.post('/maintenance/expire', authGuard(), controller.expireDownloads);

  return router;
}

module.exports = {
  createOfflineRouter,
};
