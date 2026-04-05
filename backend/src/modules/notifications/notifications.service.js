const { NotificationsRepository } = require('../../repositories/notifications.repository');
const { NotificationsError } = require('./notifications.errors');

function toNotificationDto(row) {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    title: row.title,
    body: row.body,
    channel: row.channel,
    status: row.status,
    metadata: row.metadata || null,
    scheduledFor: row.scheduledFor || null,
    sentAt: row.sentAt || null,
    readAt: row.readAt || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toPreferencesDto(row) {
  return {
    inAppNotificationsEnabled: row?.inAppNotificationsEnabled ?? true,
    pushNotificationsEnabled: row?.pushNotificationsEnabled ?? true,
    emailNotificationsEnabled: row?.emailNotificationsEnabled ?? true,
    emailMarketingEnabled: row?.emailMarketingEnabled ?? false,
    emailProductUpdatesEnabled: row?.emailProductUpdatesEnabled ?? true,
    emailSecurityAlertsEnabled: row?.emailSecurityAlertsEnabled ?? true,
    notificationTopics: row?.notificationTopics || null,
  };
}

class NotificationsService {
  constructor({ notificationsRepository = new NotificationsRepository() } = {}) {
    this.notificationsRepository = notificationsRepository;
  }

  async listUserNotifications(userId, query) {
    await this.notificationsRepository.ensureUserPreferences(userId);
    const rows = await this.notificationsRepository.listNotifications(userId, {
      channel: query.channel,
      status: query.status,
      limit: query.limit,
      includeDismissed: query.includeDismissed,
    });
    const unreadCount = await this.notificationsRepository.countUnreadNotifications(userId);

    return {
      data: rows.map(toNotificationDto),
      total: rows.length,
      unreadCount,
    };
  }

  async getNotificationPreferences(userId) {
    await this.notificationsRepository.ensureUserPreferences(userId);
    const preferences = await this.notificationsRepository.getUserPreferences(userId);
    return {
      preferences: toPreferencesDto(preferences),
    };
  }

  async updateNotificationPreferences(userId, input) {
    const updated = await this.notificationsRepository.updateUserPreferences(userId, input);
    return {
      preferences: toPreferencesDto(updated),
    };
  }

  async markAsRead(userId, notificationId) {
    const current = await this.notificationsRepository.getNotificationById(userId, notificationId);
    if (!current) {
      throw new NotificationsError(404, 'NOTIFICATION_NOT_FOUND', 'Notification was not found.');
    }

    await this.notificationsRepository.updateNotificationById(userId, notificationId, {
      status: 'READ',
      readAt: new Date(),
    });

    const updated = await this.notificationsRepository.getNotificationById(userId, notificationId);
    return {
      notification: toNotificationDto(updated),
    };
  }

  async dismissNotification(userId, notificationId) {
    const current = await this.notificationsRepository.getNotificationById(userId, notificationId);
    if (!current) {
      throw new NotificationsError(404, 'NOTIFICATION_NOT_FOUND', 'Notification was not found.');
    }

    await this.notificationsRepository.updateNotificationById(userId, notificationId, {
      status: 'DISMISSED',
    });

    const updated = await this.notificationsRepository.getNotificationById(userId, notificationId);
    return {
      notification: toNotificationDto(updated),
    };
  }

  async queuePushScaffold(userId, input) {
    await this.notificationsRepository.ensureUserPreferences(userId);
    const preferences = await this.notificationsRepository.getUserPreferences(userId);
    if (!preferences?.pushNotificationsEnabled) {
      throw new NotificationsError(403, 'PUSH_DISABLED', 'Push notifications are disabled for this user.');
    }

    const created = await this.notificationsRepository.createNotification({
      userId,
      type: 'PUSH_SCAFFOLD',
      title: input.title,
      body: input.body,
      channel: 'PUSH',
      status: 'QUEUED',
      metadata: {
        scaffold: true,
        ...input.metadata,
      },
      scheduledFor: null,
      sentAt: null,
      readAt: null,
    });

    return {
      delivery: 'PUSH_SCAFFOLD_QUEUED',
      notification: toNotificationDto(created),
    };
  }

  async deliverAnnouncement(adminUserId, input) {
    const audienceUsers = await this.notificationsRepository.listAudienceUsers(
      {
        audience: input.audience,
        marketingOnly: false,
      },
      new Date()
    );

    const scheduledFor = input.scheduleAt ? new Date(input.scheduleAt) : null;
    const items = audienceUsers.map((user) => ({
      userId: user.id,
      type: 'ANNOUNCEMENT',
      title: input.title,
      body: input.body,
      channel: 'IN_APP',
      status: scheduledFor ? 'QUEUED' : 'SENT',
      metadata: {
        createdByAdminUserId: adminUserId,
        audience: input.audience,
        ...input.metadata,
      },
      scheduledFor,
      sentAt: scheduledFor ? null : new Date(),
      readAt: null,
    }));

    const result = await this.notificationsRepository.createNotificationsBatch(items);
    return {
      deliveredCount: result.count || 0,
      audience: input.audience,
      scheduledFor,
    };
  }

  async deliverMarketingMessage(adminUserId, input) {
    const audience = input.premiumOnly ? 'PREMIUM' : input.audience;
    const users = await this.notificationsRepository.listAudienceUsers(
      {
        audience,
        marketingOnly: true,
      },
      new Date()
    );

    const type = input.premiumOnly ? 'PREMIUM_OFFER' : 'MARKETING_OFFER';
    const rows = users.map((user) => ({
      userId: user.id,
      type,
      title: input.title,
      body: input.body,
      channel: 'IN_APP',
      status: 'SENT',
      metadata: {
        createdByAdminUserId: adminUserId,
        audience,
        marketing: true,
        ...input.metadata,
      },
      scheduledFor: null,
      sentAt: new Date(),
      readAt: null,
    }));

    const result = await this.notificationsRepository.createNotificationsBatch(rows);
    return {
      deliveredCount: result.count || 0,
      audience,
      type,
    };
  }
}

function createNotificationsService(dependencies) {
  return new NotificationsService(dependencies);
}

module.exports = {
  NotificationsService,
  createNotificationsService,
};