const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

const { createAdsRouter } = require('../../src/modules/ads/ads.routes');

function createStubController() {
  return {
    getAdFeed: (_req, res) => res.status(200).json({ route: 'feed' }),
    getBannerAd: (_req, res) => res.status(200).json({ route: 'banner' }),
    getInterstitialRules: (_req, res) => res.status(200).json({ route: 'interstitial' }),
    getRewardedAd: (_req, res) => res.status(200).json({ route: 'rewarded' }),
    trackAdInteraction: (_req, res) => res.status(201).json({ tracked: true }),
    listPromoBanners: (_req, res) => res.status(200).json({ route: 'promo-banners' }),
    listAnnouncements: (_req, res) => res.status(200).json({ route: 'announcements' }),
    listAdminCampaigns: (_req, res) => res.status(200).json({ route: 'admin-list' }),
    createAdminCampaign: (_req, res) => res.status(201).json({ route: 'admin-create' }),
    updateAdminCampaign: (_req, res) => res.status(200).json({ route: 'admin-update' }),
  };
}

function buildApp() {
  const app = express();
  app.use(express.json());

  const fakeRequireAuth = () => (req, _res, next) => {
    req.auth = {
      userId: 'user-1',
      role: req.headers['x-test-role'] || 'USER',
      email: 'user@example.com',
    };
    next();
  };

  const fakeRequireRole = (role) => (req, _res, next) => {
    if (req.auth.role !== role) {
      return next({ statusCode: 403, code: 'FORBIDDEN', message: 'Forbidden' });
    }
    return next();
  };

  app.use(
    '/ads',
    createAdsRouter({
      requireAuth: fakeRequireAuth,
      requireRole: fakeRequireRole,
      controller: createStubController(),
    })
  );

  app.use((err, _req, res, _next) => {
    res.status(err.statusCode || 500).json({ code: err.code || 'ERR', error: err.message });
  });

  return app;
}

test('GET /ads/feed validates optional placement query', async () => {
  const app = buildApp();
  const response = await request(app).get('/ads/feed?placement=HOME');

  assert.equal(response.status, 200);
  assert.equal(response.body.route, 'feed');
});

test('GET /ads/banner rejects invalid placement query', async () => {
  const app = buildApp();
  const response = await request(app).get('/ads/banner?placement=INVALID');

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('POST /ads/events validates and tracks interaction payload', async () => {
  const app = buildApp();

  const invalid = await request(app).post('/ads/events').send({ interactionType: 'VIEW' });
  assert.equal(invalid.status, 400);

  const valid = await request(app).post('/ads/events').send({
    interactionType: 'IMPRESSION',
    placement: 'HOME',
    creativeType: 'BANNER',
  });
  assert.equal(valid.status, 201);
  assert.equal(valid.body.tracked, true);
});

test('GET /ads/admin/campaigns enforces admin role', async () => {
  const app = buildApp();
  const response = await request(app).get('/ads/admin/campaigns');

  assert.equal(response.status, 403);
  assert.equal(response.body.code, 'FORBIDDEN');
});

test('POST /ads/admin/campaigns validates payload', async () => {
  const app = buildApp();
  const response = await request(app)
    .post('/ads/admin/campaigns')
    .set('x-test-role', 'ADMIN')
    .send({});

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('PATCH /ads/admin/campaigns/:campaignId validates campaign id', async () => {
  const app = buildApp();
  const response = await request(app)
    .patch('/ads/admin/campaigns/not-a-uuid')
    .set('x-test-role', 'ADMIN')
    .send({ status: 'ACTIVE' });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('POST /ads/admin/campaigns accepts valid admin payload', async () => {
  const app = buildApp();
  const response = await request(app)
    .post('/ads/admin/campaigns')
    .set('x-test-role', 'ADMIN')
    .send({
      name: '[BANNER] Weekend Push',
      status: 'ACTIVE',
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.route, 'admin-create');
});
