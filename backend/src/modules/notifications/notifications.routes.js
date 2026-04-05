const express = require('express');

const { requireAuth, requireRole } = require('../auth/auth.middleware');
const { createNotificationsController } = require('./notifications.controller');
const {
  validateBody,
  validateQuery,
  validateParams,
  notificationIdParamsSchema,
  listNotificationsQuerySchema,
  updateNotificationPreferencesSchema,
  pushScaffoldSchema,
  announcementDeliverySchema,
  marketingOfferSchema,
} = require('./notifications.schemas');

function createNotificationsRouter(options = {}) {
  const router = express.Router();
  const authGuard = options.requireAuth || requireAuth;
  const roleGuard = options.requireRole || requireRole;
  const controller = options.controller || createNotificationsController();

  router.get('/', authGuard(), validateQuery(listNotificationsQuerySchema), controller.listUserNotifications);
  router.get('/preferences', authGuard(), controller.getNotificationPreferences);
  router.patch(
    '/preferences',
    authGuard(),
    validateBody(updateNotificationPreferencesSchema),
    controller.updateNotificationPreferences
  );
  router.patch(
    '/:notificationId/read',
    authGuard(),
    validateParams(notificationIdParamsSchema),
    controller.markAsRead
  );
  router.patch(
    '/:notificationId/dismiss',
    authGuard(),
    validateParams(notificationIdParamsSchema),
    controller.dismissNotification
  );
  router.post('/push/scaffold', authGuard(), validateBody(pushScaffoldSchema), controller.queuePushScaffold);

  router.post(
    '/admin/announcements',
    authGuard(),
    roleGuard('ADMIN'),
    validateBody(announcementDeliverySchema),
    controller.deliverAnnouncement
  );
  router.post(
    '/admin/messages/marketing',
    authGuard(),
    roleGuard('ADMIN'),
    validateBody(marketingOfferSchema),
    controller.deliverMarketingMessage
  );

  return router;
}

module.exports = {
  createNotificationsRouter,
};