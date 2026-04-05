const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

const { createLibraryRouter } = require('../../src/modules/catalog/library.routes');

function createStubController() {
  return {
    listSongs: (_req, res) => res.status(200).json({ ok: true, route: 'list' }),
    searchSongs: (_req, res) => res.status(200).json({ ok: true, route: 'song-search' }),
    searchCollections: (_req, res) => res.status(200).json({ ok: true, route: 'collection-search' }),
    songDetail: (req, res) => res.status(200).json({ ok: true, songId: req.params.songId }),
    summary: (_req, res) => res.status(200).json({ ok: true, route: 'summary' }),
  };
}

function buildApp() {
  const app = express();
  app.use(express.json());

  const fakeRequireAuth = () => (req, _res, next) => {
    req.auth = { userId: 'user-1', role: 'USER', email: 'user@example.com' };
    next();
  };

  app.use('/library', createLibraryRouter({ requireAuth: fakeRequireAuth, controller: createStubController() }));

  app.use((err, _req, res, _next) => {
    res.status(err.statusCode || 500).json({ code: err.code || 'ERR', error: err.message });
  });

  return app;
}

test('GET /library/songs validates list query', async () => {
  const app = buildApp();
  const response = await request(app).get('/library/songs?page=0');

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('GET /library/songs accepts valid query', async () => {
  const app = buildApp();
  const response = await request(app).get('/library/songs?filter=favorites&page=1&pageSize=10&sortOrder=asc');

  assert.equal(response.status, 200);
  assert.equal(response.body.route, 'list');
});

test('GET /library/search requires q parameter', async () => {
  const app = buildApp();
  const response = await request(app).get('/library/search?page=1');

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('GET /library/songs/search requires q parameter', async () => {
  const app = buildApp();
  const response = await request(app).get('/library/songs/search?page=1');

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('GET /library/songs/search accepts valid search query', async () => {
  const app = buildApp();
  const response = await request(app).get('/library/songs/search?q=track&page=1&pageSize=10');

  assert.equal(response.status, 200);
  assert.equal(response.body.route, 'song-search');
});

test('GET /library/songs/:songId returns detail route', async () => {
  const app = buildApp();
  const response = await request(app).get('/library/songs/song-1');

  assert.equal(response.status, 200);
  assert.equal(response.body.songId, 'song-1');
});

test('GET /library/songs rejects unexpected query keys', async () => {
  const app = buildApp();
  const response = await request(app).get('/library/songs?unexpected=1');

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});
