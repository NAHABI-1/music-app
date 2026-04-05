const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

const { createOfflineRouter } = require('../../src/modules/media/offline.routes');

function createStubController() {
  return {
    requestOfflineAccess: (_req, res) => res.status(201).json({ ok: true, route: 'request' }),
    updateDownloadStatus: (_req, res) => res.status(200).json({ ok: true, route: 'update' }),
    listDownloads: (_req, res) => res.status(200).json({ ok: true, route: 'list' }),
    validateEntitlement: (_req, res) => res.status(200).json({ ok: true, route: 'entitlement' }),
    revokeDownload: (_req, res) => res.status(200).json({ ok: true, route: 'revoke' }),
    expireDownloads: (_req, res) => res.status(200).json({ ok: true, route: 'expire' }),
  };
}

function buildApp() {
  const app = express();
  app.use(express.json());

  const fakeRequireAuth = () => (req, _res, next) => {
    req.auth = { userId: 'user-1', role: 'USER', email: 'user@example.com' };
    next();
  };

  app.use('/offline', createOfflineRouter({ requireAuth: fakeRequireAuth, controller: createStubController() }));

  app.use((err, _req, res, _next) => {
    res.status(err.statusCode || 500).json({ code: err.code || 'ERR', error: err.message });
  });

  return app;
}

test('POST /offline/requests validates request payload', async () => {
  const app = buildApp();
  const response = await request(app).post('/offline/requests').send({ songId: 'bad-id' });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('PATCH /offline/downloads/:id/status requires localPath for READY', async () => {
  const app = buildApp();
  const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const response = await request(app).patch(`/offline/downloads/${id}/status`).send({
    status: 'READY',
    deviceSessionId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('GET /offline/entitlements/:songId validates deviceSessionId query', async () => {
  const app = buildApp();
  const songId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const response = await request(app).get(`/offline/entitlements/${songId}`);

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('DELETE /offline/downloads/:downloadId accepts valid params', async () => {
  const app = buildApp();
  const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const response = await request(app).delete(`/offline/downloads/${id}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.route, 'revoke');
});

test('POST /offline/requests accepts valid request payload', async () => {
  const app = buildApp();
  const response = await request(app).post('/offline/requests').send({
    songId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    deviceSessionId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    preferredQuality: 'MEDIUM',
    lowDataMode: false,
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.route, 'request');
});
