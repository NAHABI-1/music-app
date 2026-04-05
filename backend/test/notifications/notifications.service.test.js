const test = require('node:test');
const assert = require('node:assert/strict');

const { NotificationsService } = require('../../src/modules/notifications/notifications.service');

function createRepositoryDouble(overrides = {}) {
  return {
    ensureUserPreferences: async () => ({ userId: 'u-1' }),
    getUserPreferences: async () => ({
      userId: 'u-1',
      inAppNotificationsEnabled: true,
      pushNotificationsEnabled: true,
      emailNotificationsEnabled: true,
      emailMarketingEnabled: false,
      emailProductUpdatesEnabled: true,
      emailSecurityAlertsEnabled: true,
      notificationTopics: null,
    }),
    updateUserPreferences: async (_userId, updates) => ({
      userId: 'u-1',
      inAppNotificationsEnabled: updates.inAppNotificationsEnabled ?? true,
      pushNotificationsEnabled: updates.pushNotificationsEnabled ?? true,
      emailNotificationsEnabled: updates.emailNotificationsEnabled ?? true,
      emailMarketingEnabled: updates.emailMarketingEnabled ?? false,
      emailProductUpdatesEnabled: updates.emailProductUpdatesEnabled ?? true,
      emailSecurityAlertsEnabled: updates.emailSecurityAlertsEnabled ?? true,
      notificationTopics: updates.notificationTopics ?? null,
    }),
    listNotifications: async () => [
      {
        id: 'n-1',
        userId: 'u-1',
        type: 'ANNOUNCEMENT',
        title: 'Notice',
        body: 'Body',
        channel: 'IN_APP',
        status: 'SENT',
        metadata: null,
        scheduledFor: null,
        sentAt: new Date('2025-01-01T00:00:00.000Z'),
        readAt: null,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      },
    ],
    countUnreadNotifications: async () => 3,
    getNotificationById: async () => ({
      id: 'n-1',
      userId: 'u-1',
      type: 'ANNOUNCEMENT',
      title: 'Notice',
      body: 'Body',
      channel: 'IN_APP',
      status: 'READ',
      metadata: null,
      scheduledFor: null,
      sentAt: new Date('2025-01-01T00:00:00.000Z'),
      readAt: new Date('2025-01-01T01:00:00.000Z'),
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T01:00:00.000Z'),
    }),
    updateNotificationById: async () => ({ count: 1 }),
    createNotification: async (data) => ({
      id: 'n-new',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      ...data,
    }),
    createNotificationsBatch: async (rows) => ({ count: rows.length }),
    listAudienceUsers: async () => [{ id: 'u-1' }, { id: 'u-2' }],
    ...overrides,
  };
}

test('listUserNotifications returns inbox data and unread count', async () => {
  const service = new NotificationsService({
    notificationsRepository: createRepositoryDouble(),
  });

  const result = await service.listUserNotifications('u-1', {
    limit: 30,
    includeDismissed: false,
  });

  assert.equal(result.total, 1);
  assert.equal(result.unreadCount, 3);
  assert.equal(result.data[0].id, 'n-1');
});

test('updateNotificationPreferences persists and returns normalized values', async () => {
  const service = new NotificationsService({
    notificationsRepository: createRepositoryDouble(),
  });

  const result = await service.updateNotificationPreferences('u-1', {
    pushNotificationsEnabled: false,
    emailMarketingEnabled: true,
  });

  assert.equal(result.preferences.pushNotificationsEnabled, false);
  assert.equal(result.preferences.emailMarketingEnabled, true);
});

test('queuePushScaffold rejects when push is disabled', async () => {
  const service = new NotificationsService({
    notificationsRepository: createRepositoryDouble({
      getUserPreferences: async () => ({
        userId: 'u-1',
        pushNotificationsEnabled: false,
      }),
    }),
  });

  await assert.rejects(
    () =>
      service.queuePushScaffold('u-1', {
        title: 'Hello',
        body: 'World',
      }),
    (error) => error.code === 'PUSH_DISABLED'
  );
});

test('deliverAnnouncement creates one notification per recipient', async () => {
  const calls = [];
  const service = new NotificationsService({
    notificationsRepository: createRepositoryDouble({
      createNotificationsBatch: async (rows) => {
        calls.push(rows);
        return { count: rows.length };
      },
      listAudienceUsers: async () => [{ id: 'u-1' }, { id: 'u-2' }, { id: 'u-3' }],
    }),
  });

  const result = await service.deliverAnnouncement('admin-1', {
    title: 'App update',
    body: 'Version 2 is live',
    audience: 'ALL',
  });

  assert.equal(result.deliveredCount, 3);
  assert.equal(calls[0][0].type, 'ANNOUNCEMENT');
});

test('deliverMarketingMessage emits premium offer type when premiumOnly is true', async () => {
  const rowsCaptured = [];
  const service = new NotificationsService({
    notificationsRepository: createRepositoryDouble({
      listAudienceUsers: async () => [{ id: 'u-9' }],
      createNotificationsBatch: async (rows) => {
        rowsCaptured.push(...rows);
        return { count: rows.length };
      },
    }),
  });

  const result = await service.deliverMarketingMessage('admin-1', {
    title: 'Upgrade',
    body: 'Go Premium for lossless quality',
    audience: 'ALL',
    premiumOnly: true,
  });

  assert.equal(result.type, 'PREMIUM_OFFER');
  assert.equal(rowsCaptured[0].type, 'PREMIUM_OFFER');
});

test('markAsRead throws NOTIFICATION_NOT_FOUND when missing', async () => {
  const service = new NotificationsService({
    notificationsRepository: createRepositoryDouble({
      getNotificationById: async () => null,
    }),
  });

  await assert.rejects(
    () => service.markAsRead('u-1', 'missing-id'),
    (error) => error.code === 'NOTIFICATION_NOT_FOUND'
  );
});

test('deliverMarketingMessage targets premium audience when premiumOnly is enabled', async () => {
  let audienceArg;
  const service = new NotificationsService({
    notificationsRepository: createRepositoryDouble({
      listAudienceUsers: async ({ audience }) => {
        audienceArg = audience;
        return [{ id: 'u-premium-1' }];
      },
    }),
  });

  const result = await service.deliverMarketingMessage('admin-1', {
    title: 'Premium perks',
    body: 'Exclusive content',
    audience: 'ALL',
    premiumOnly: true,
  });

  assert.equal(audienceArg, 'PREMIUM');
  assert.equal(result.deliveredCount, 1);
});