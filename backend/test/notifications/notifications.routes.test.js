const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

const { createNotificationsRouter } = require('../../src/modules/notifications/notifications.routes');

function buildAuthDouble() {
  return (requiredRole) => (req, res, next) => {
    const role = req.header('x-test-role') || 'USER';
    if (requiredRole && role !== requiredRole) {
      return res.status(403).json({
        code: 'FORBIDDEN',
      });
    }

    req.auth = {
      userId: req.header('x-test-user-id') || 'u-1',
      role,
    };
    return next();
  };
}

function buildRoleGuardDouble() {
  return (requiredRole) => (req, res, next) => {
    if (req.auth?.role !== requiredRole) {
      return res.status(403).json({
        code: 'FORBIDDEN',
      });
    }

    return next();
  };
}

function buildApp(controller) {
  const app = express();
  app.use(express.json());
  app.use(
    '/notifications',
    createNotificationsRouter({
      controller,
      requireAuth: buildAuthDouble(),
      requireRole: buildRoleGuardDouble(),
    })
  );
  app.use((error, _req, res, _next) => {
    res.status(error.statusCode || 500).json({
      code: error.code || 'INTERNAL_ERROR',
      message: error.message,
    });
  });

  return app;
}

test('GET /notifications returns inbox payload', async () => {
  const app = buildApp({
    listUserNotifications: async (_req, res) => {
      res.status(200).json({
        data: [],
        total: 0,
        unreadCount: 0,
      });
    },
    getNotificationPreferences: async () => {},
    updateNotificationPreferences: async () => {},
    markAsRead: async () => {},
    dismissNotification: async () => {},
    queuePushScaffold: async () => {},
    deliverAnnouncement: async () => {},
    deliverMarketingMessage: async () => {},
  });

  const response = await request(app).get('/notifications');
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.unreadCount, 0);
});

test('PATCH /notifications/preferences validates body payload', async () => {
  const app = buildApp({
    listUserNotifications: async () => {},
    getNotificationPreferences: async () => {},
    updateNotificationPreferences: async (_req, res) => {
      res.status(200).json({
        preferences: {
          pushNotificationsEnabled: true,
        },
      });
    },
    markAsRead: async () => {},
    dismissNotification: async () => {},
    queuePushScaffold: async () => {},
    deliverAnnouncement: async () => {},
    deliverMarketingMessage: async () => {},
  });

  const invalid = await request(app).patch('/notifications/preferences').send({});
  assert.equal(invalid.statusCode, 400);

  const valid = await request(app)
    .patch('/notifications/preferences')
    .send({ pushNotificationsEnabled: false });
  assert.equal(valid.statusCode, 200);
});

test('PATCH /notifications/:notificationId/read validates UUID', async () => {
  const app = buildApp({
    listUserNotifications: async () => {},
    getNotificationPreferences: async () => {},
    updateNotificationPreferences: async () => {},
    markAsRead: async (_req, res) => {
      res.status(200).json({ notification: { id: 'c6c1c9c5-4695-4f50-8f29-84fce8e176af' } });
    },
    dismissNotification: async () => {},
    queuePushScaffold: async () => {},
    deliverAnnouncement: async () => {},
    deliverMarketingMessage: async () => {},
  });

  const invalid = await request(app).patch('/notifications/not-a-uuid/read');
  assert.equal(invalid.statusCode, 400);

  const valid = await request(app).patch('/notifications/c6c1c9c5-4695-4f50-8f29-84fce8e176af/read');
  assert.equal(valid.statusCode, 200);
});

test('POST /notifications/admin/announcements requires admin role', async () => {
  const app = buildApp({
    listUserNotifications: async () => {},
    getNotificationPreferences: async () => {},
    updateNotificationPreferences: async () => {},
    markAsRead: async () => {},
    dismissNotification: async () => {},
    queuePushScaffold: async () => {},
    deliverAnnouncement: async (_req, res) => {
      res.status(200).json({ deliveredCount: 1 });
    },
    deliverMarketingMessage: async () => {},
  });

  const forbidden = await request(app).post('/notifications/admin/announcements').send({
    title: 'System message',
    body: 'Scheduled maintenance',
    audience: 'ALL',
  });
  assert.equal(forbidden.statusCode, 403);

  const ok = await request(app)
    .post('/notifications/admin/announcements')
    .set('x-test-role', 'ADMIN')
    .send({
      title: 'System message',
      body: 'Scheduled maintenance',
      audience: 'ALL',
    });
  assert.equal(ok.statusCode, 200);
  assert.equal(ok.body.deliveredCount, 1);
});