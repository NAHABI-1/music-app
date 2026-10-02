const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

const { createPlaybackRouter } = require('../../src/modules/media/playback.routes');

function createStubController() {
  return {
    startSession: (_req, res) => res.status(201).json({ ok: true, route: 'start' }),
    getSession: (_req, res) => res.status(200).json({ ok: true, route: 'get-session' }),
    updateProgress: (_req, res) => res.status(200).json({ ok: true, route: 'progress' }),
    endSession: (_req, res) => res.status(200).json({ ok: true, route: 'end' }),
    getResume: (_req, res) => res.status(200).json({ ok: true, route: 'resume' }),
  };
}

function buildApp({ requireAuthMiddleware } = {}) {
  const app = express();
  app.use(express.json());

  const fakeRequireAuth =
    requireAuthMiddleware ||
    (() => (req, _res, next) => {
      req.auth = { userId: 'user-1', role: 'USER', email: 'user@example.com' };
      next();
    });

  app.use('/playback', createPlaybackRouter({ requireAuth: fakeRequireAuth, controller: createStubController() }));

  app.use((err, _req, res, _next) => {
    res.status(err.statusCode || 500).json({ code: err.code || 'ERR', error: err.message });
  });

  return app;
}

test('POST /playback/sessions rejects unauthenticated request', async () => {
  const app = buildApp({
    requireAuthMiddleware: () => (_req, _res, next) =>
      next({ statusCode: 401, code: 'AUTH_REQUIRED', message: 'Authentication is required.' }),
  });
  const response = await request(app).post('/playback/sessions').send({});

  assert.equal(response.status, 401);
  assert.equal(response.body.code, 'AUTH_REQUIRED');
});

test('POST /playback/sessions validates body', async () => {
  const app = buildApp();
  const response = await request(app).post('/playback/sessions').send({ songId: 'bad-id' });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('POST /playback/sessions accepts valid payload', async () => {
  const app = buildApp();
  const response = await request(app).post('/playback/sessions').send({
    songId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    quality: 'AUTO',
    lowDataMode: false,
    playbackSource: 'STREAM',
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.route, 'start');
});

