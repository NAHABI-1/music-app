const { createNotificationsService } = require('./notifications.service');

function createNotificationsController(service) {
  const notificationsService = service || createNotificationsService();

  return {
    listUserNotifications: async (request, response, next) => {
      try {
        const payload = await notificationsService.listUserNotifications(
          request.auth.userId,
          request.validatedQuery
        );
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    getNotificationPreferences: async (request, response, next) => {
      try {
        const payload = await notificationsService.getNotificationPreferences(request.auth.userId);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    updateNotificationPreferences: async (request, response, next) => {
      try {
        const payload = await notificationsService.updateNotificationPreferences(
          request.auth.userId,
          request.validatedBody
        );
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    markAsRead: async (request, response, next) => {
      try {
        const payload = await notificationsService.markAsRead(
          request.auth.userId,
          request.validatedParams.notificationId
        );
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    dismissNotification: async (request, response, next) => {
      try {
        const payload = await notificationsService.dismissNotification(
          request.auth.userId,
          request.validatedParams.notificationId
        );
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    queuePushScaffold: async (request, response, next) => {
      try {
        const payload = await notificationsService.queuePushScaffold(
          request.auth.userId,
          request.validatedBody
        );
        response.status(201).json(payload);
      } catch (error) {
        next(error);
      }
    },

    deliverAnnouncement: async (request, response, next) => {
      try {
        const payload = await notificationsService.deliverAnnouncement(
          request.auth.userId,
          request.validatedBody
        );
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    deliverMarketingMessage: async (request, response, next) => {
      try {
        const payload = await notificationsService.deliverMarketingMessage(
          request.auth.userId,
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
  createNotificationsController,
};