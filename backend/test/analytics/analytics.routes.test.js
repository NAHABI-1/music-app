const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

const { createAnalyticsRouter } = require('../../src/modules/analytics/analytics.routes');

function buildAuthDouble() {
  return () => (req, _res, next) => {
    req.auth = {
      userId: req.header('x-test-user-id') || 'u-1',
      role: req.header('x-test-role') || 'USER',
    };
    return next();
  };
}

function buildRoleGuardDouble() {
  return (requiredRole) => (req, res, next) => {
    if (req.auth?.role !== requiredRole) {
      return res.status(403).json({ code: 'FORBIDDEN' });
    }
    return next();
  };
}

function buildApp(controller) {
  const app = express();
  app.use(express.json());
  app.use(
    '/analytics',
    createAnalyticsRouter({
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

function buildController() {
  return {
    ingestEvent: async (_req, res) => res.status(201).json({ accepted: true }),
    ingestEventsBatch: async (_req, res) => res.status(201).json({ acceptedCount: 2, requestedCount: 2 }),
    getUserSummary: async (_req, res) => res.status(200).json({ totalEvents: 0 }),
    getAdminOverview: async (_req, res) => res.status(200).json({ totalEvents: 10 }),
    getAdminEventsReport: async (_req, res) =>
      res.status(200).json({ data: [], pagination: { page: 1, pageSize: 50, total: 0, totalPages: 1 } }),
  };
}

test('POST /analytics/events validates payload and accepts supported event names', async () => {
  const app = buildApp(buildController());

  const invalid = await request(app).post('/analytics/events').send({ eventName: 'unknown_event' });
  assert.equal(invalid.statusCode, 400);

  const valid = await request(app).post('/analytics/events').send({ eventName: 'retention_checkin' });
  assert.equal(valid.statusCode, 201);
  assert.equal(valid.body.accepted, true);
});

test('POST /analytics/events/batch ingests multiple events', async () => {
  const app = buildApp(buildController());

  const response = await request(app)
    .post('/analytics/events/batch')
    .send({
      events: [{ eventName: 'upload_initiated' }, { eventName: 'upload_completed' }],
    });

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.acceptedCount, 2);
});

test('GET /analytics/summary returns user analytics summary', async () => {
  const app = buildApp(buildController());
  const response = await request(app).get('/analytics/summary?days=30');

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.totalEvents, 0);
});

test('GET /analytics/admin/reports/overview enforces admin role', async () => {
  const app = buildApp(buildController());

  const forbidden = await request(app).get('/analytics/admin/reports/overview?days=7');
  assert.equal(forbidden.statusCode, 403);

  const allowed = await request(app)
    .get('/analytics/admin/reports/overview?days=7')
    .set('x-test-role', 'ADMIN');
  assert.equal(allowed.statusCode, 200);
  assert.equal(allowed.body.totalEvents, 10);
});

test('GET /analytics/admin/reports/overview validates optional source filter', async () => {
  const app = buildApp(buildController());

  const invalid = await request(app)
    .get('/analytics/admin/reports/overview?days=7&source=INVALID')
    .set('x-test-role', 'ADMIN');
  assert.equal(invalid.statusCode, 400);

  const valid = await request(app)
    .get('/analytics/admin/reports/overview?days=7&source=BACKEND')
    .set('x-test-role', 'ADMIN');
  assert.equal(valid.statusCode, 200);
});

test('GET /analytics/admin/reports/events validates pageSize upper bound', async () => {
  const app = buildApp(buildController());

  const invalid = await request(app)
    .get('/analytics/admin/reports/events?days=7&pageSize=101')
    .set('x-test-role', 'ADMIN');
  assert.equal(invalid.statusCode, 400);
});