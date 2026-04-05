const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

const { createInteractionRouter } = require('../../src/modules/catalog/interaction.routes');

function createStubController() {
  return {
    likeSong: (_req, res) => res.status(200).json({ ok: true, route: 'like' }),
    unlikeSong: (_req, res) => res.status(200).json({ ok: true, route: 'unlike' }),
    listFavorites: (_req, res) => res.status(200).json({ ok: true, route: 'favorites' }),
    trackRecentlyPlayed: (_req, res) => res.status(201).json({ ok: true, route: 'track-recent' }),
    listRecentlyPlayed: (_req, res) => res.status(200).json({ ok: true, route: 'recent' }),
  };
}

function buildApp() {
  const app = express();
  app.use(express.json());

  const fakeRequireAuth = () => (req, _res, next) => {
    req.auth = { userId: 'user-1', role: 'USER', email: 'user@example.com' };
    next();
  };

  app.use(
    '/interactions',
    createInteractionRouter({
      requireAuth: fakeRequireAuth,
      controller: createStubController(),
    })
  );

  app.use((err, _req, res, _next) => {
    res.status(err.statusCode || 500).json({ code: err.code || 'ERR', error: err.message });
  });

  return app;
}

test('POST /interactions/songs/:songId/favorite validates song id', async () => {
  const app = buildApp();
  const response = await request(app).post('/interactions/songs/not-uuid/favorite').send({});

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('GET /interactions/favorites validates pagination query', async () => {
  const app = buildApp();
  const response = await request(app).get('/interactions/favorites?page=0');

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('POST /interactions/recently-played validates tracking payload', async () => {
  const app = buildApp();
  const response = await request(app).post('/interactions/recently-played').send({ songId: 'bad-id' });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('POST /interactions/recently-played accepts valid payload', async () => {
  const app = buildApp();
  const response = await request(app).post('/interactions/recently-played').send({
    songId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    playbackSource: 'STREAM',
    playDurationSecs: 12,
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.route, 'track-recent');
});

test('POST /interactions/songs/:songId/favorite accepts valid song id', async () => {
  const app = buildApp();
  const response = await request(app).post('/interactions/songs/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/favorite');

  assert.equal(response.status, 200);
  assert.equal(response.body.route, 'like');
});

test('GET /interactions/recently-played accepts valid query', async () => {
  const app = buildApp();
  const response = await request(app).get('/interactions/recently-played?page=1&pageSize=20');

  assert.equal(response.status, 200);
  assert.equal(response.body.route, 'recent');
});

test('DELETE /interactions/songs/:songId/favorite accepts valid song id', async () => {
  const app = buildApp();
  const response = await request(app).delete('/interactions/songs/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/favorite');

  assert.equal(response.status, 200);
  assert.equal(response.body.route, 'unlike');
});
