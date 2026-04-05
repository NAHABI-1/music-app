const express = require('express');

const { requireAuth, requireRole } = require('../auth/auth.middleware');
const { createAnalyticsController } = require('./analytics.controller');
const {
  validateBody,
  validateQuery,
  ingestionEventSchema,
  ingestBatchSchema,
  summaryQuerySchema,
  adminOverviewQuerySchema,
  adminEventsQuerySchema,
} = require('./analytics.schemas');

function createAnalyticsRouter(options = {}) {
  const router = express.Router();
  const authGuard = options.requireAuth || requireAuth;
  const roleGuard = options.requireRole || requireRole;
  const controller = options.controller || createAnalyticsController();

  router.post('/events', authGuard(), validateBody(ingestionEventSchema), controller.ingestEvent);
  router.post('/events/batch', authGuard(), validateBody(ingestBatchSchema), controller.ingestEventsBatch);
  router.get('/summary', authGuard(), validateQuery(summaryQuerySchema), controller.getUserSummary);

  router.get(
    '/admin/reports/overview',
    authGuard(),
    roleGuard('ADMIN'),
    validateQuery(adminOverviewQuerySchema),
    controller.getAdminOverview
  );
  router.get(
    '/admin/reports/events',
    authGuard(),
    roleGuard('ADMIN'),
    validateQuery(adminEventsQuerySchema),
    controller.getAdminEventsReport
  );

  return router;
}

module.exports = {
  createAnalyticsRouter,
};