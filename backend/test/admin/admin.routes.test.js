const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

const { createAdminRouter } = require('../../src/modules/admin/admin.routes');

function buildAuthDouble(role = 'ADMIN') {
  return () => (req, _res, next) => {
    req.auth = {
      userId: '9b8f45b5-c584-4bf7-8a49-9295b35c5f1f',
      role,
      email: 'admin@example.com',
    };
    next();
  };
}

function buildAdminGuardDouble() {
  return () => (req, res, next) => {
    if (!req.auth || req.auth.role !== 'ADMIN') {
      return res.status(403).json({ code: 'ADMIN_REQUIRED' });
    }
    return next();
  };
}

function buildControllerDouble() {
  return {
    getUsers: async (_req, res) => res.status(200).json({ data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }),
    getUserDetails: async (_req, res) => res.status(200).json({ id: 'u1' }),
    suspendUser: async (_req, res) => res.status(200).json({ ok: true }),
    activateUser: async (_req, res) => res.status(200).json({ ok: true }),
    deleteUser: async (_req, res) => res.status(200).json({ ok: true }),
    updateUserRole: async (_req, res) => res.status(200).json({ ok: true }),
    getUploadsForReview: async (_req, res) => res.status(200).json({ data: [] }),
    reviewUpload: async (_req, res) => res.status(200).json({ ok: true }),
    blockSong: async (_req, res) => res.status(200).json({ ok: true }),
    unblockSong: async (_req, res) => res.status(200).json({ ok: true }),
    getPromoCodes: async (_req, res) => res.status(200).json({ data: [] }),
    createPromoCode: async (_req, res) => res.status(201).json({ ok: true }),
    updatePromoCode: async (_req, res) => res.status(200).json({ ok: true }),
    deletePromoCode: async (_req, res) => res.status(200).json({ ok: true }),
    getPlans: async (_req, res) => res.status(200).json([]),
    createPlan: async (_req, res) => res.status(201).json({ ok: true }),
    updatePlan: async (_req, res) => res.status(200).json({ ok: true }),
    deletePlan: async (_req, res) => res.status(200).json({ ok: true }),
    getDashboardStats: async (_req, res) => res.status(200).json({ totalUsers: 0 }),
    getUserGrowthMetrics: async (_req, res) => res.status(200).json([]),
    sendNotification: async (_req, res) => res.status(200).json({ success: true }),
  };
}

function buildApp({ role = 'ADMIN' } = {}) {
  const app = express();
  app.use(express.json());

  app.use(
    '/admin',
    createAdminRouter({
      controller: buildControllerDouble(),
      requireAuth: buildAuthDouble(role),
      requireAdmin: buildAdminGuardDouble(),
    })
  );

  app.use((error, _req, res, _next) => {
    res.status(error.statusCode || 500).json({
      code: error.code || 'INTERNAL_ERROR',
      message: error.message,
      details: error.details,
    });
  });

  return app;
}

test('GET /admin/users is forbidden for non-admin role', async () => {
  const app = buildApp({ role: 'USER' });
  const response = await request(app).get('/admin/users');

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.code, 'ADMIN_REQUIRED');
});

test('POST /admin/notifications/send validates SEGMENT recipient requirements', async () => {
  const app = buildApp();
  const response = await request(app).post('/admin/notifications/send').send({
    recipientType: 'SEGMENT',
    title: 'Hello',
    message: 'World',
    channels: ['IN_APP'],
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('POST /admin/notifications/send validates USERS recipient requirements', async () => {
  const app = buildApp();
  const response = await request(app).post('/admin/notifications/send').send({
    recipientType: 'USERS',
    title: 'Promo',
    message: 'Check this out',
    channels: ['PUSH'],
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('POST /admin/promo-codes accepts FIXED discount values above 100', async () => {
  const app = buildApp();
  const response = await request(app).post('/admin/promo-codes').send({
    code: 'BIGSAVE',
    discountType: 'FIXED',
    discountValue: 500,
    expiresAt: '2026-12-31T23:59:59.000Z',
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.ok, true);
});

test('POST /admin/promo-codes rejects PERCENT discount values above 100', async () => {
  const app = buildApp();
  const response = await request(app).post('/admin/promo-codes').send({
    code: 'TOOHIGH',
    discountType: 'PERCENT',
    discountValue: 150,
    expiresAt: '2026-12-31T23:59:59.000Z',
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});
