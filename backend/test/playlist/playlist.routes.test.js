const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

const { createPlaylistRouter } = require('../../src/modules/catalog/playlist.routes');

function createStubController() {
  return {
    createPlaylist: (_req, res) => res.status(201).json({ ok: true, route: 'create' }),
    renamePlaylist: (_req, res) => res.status(200).json({ ok: true, route: 'rename' }),
    deletePlaylist: (_req, res) => res.status(200).json({ ok: true, route: 'delete' }),
    addSongToPlaylist: (_req, res) => res.status(200).json({ ok: true, route: 'add-song' }),
    removeSongFromPlaylist: (_req, res) => res.status(200).json({ ok: true, route: 'remove-song' }),
    reorderPlaylistItems: (_req, res) => res.status(200).json({ ok: true, route: 'reorder' }),
    listUserPlaylists: (_req, res) => res.status(200).json({ ok: true, route: 'list' }),
    getPlaylistDetail: (_req, res) => res.status(200).json({ ok: true, route: 'detail' }),
  };
}

function buildApp() {
  const app = express();
  app.use(express.json());

  const fakeRequireAuth = () => (req, _res, next) => {
    req.auth = { userId: 'user-1', role: 'USER', email: 'user@example.com' };
    next();
  };

  app.use('/playlists', createPlaylistRouter({ requireAuth: fakeRequireAuth, controller: createStubController() }));

  app.use((err, _req, res, _next) => {
    res.status(err.statusCode || 500).json({ code: err.code || 'ERR', error: err.message });
  });

  return app;
}

test('POST /playlists validates create payload', async () => {
  const app = buildApp();
  const response = await request(app).post('/playlists').send({ title: '' });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('GET /playlists validates pagination query', async () => {
  const app = buildApp();
  const response = await request(app).get('/playlists?page=0');

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('PATCH /playlists/:id validates route param and payload', async () => {
  const app = buildApp();
  const response = await request(app).patch('/playlists/not-uuid').send({ title: 'Renamed' });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('POST /playlists/:id/items validates song payload', async () => {
  const app = buildApp();
  const playlistId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const response = await request(app).post(`/playlists/${playlistId}/items`).send({ songId: 'bad-id' });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('PATCH /playlists/:id/items/reorder rejects duplicate item ids', async () => {
  const app = buildApp();
  const playlistId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const itemId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  const response = await request(app)
    .patch(`/playlists/${playlistId}/items/reorder`)
    .send({ itemIds: [itemId, itemId] });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('GET /playlists/:id returns detail route', async () => {
  const app = buildApp();
  const playlistId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  const response = await request(app).get(`/playlists/${playlistId}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.route, 'detail');
});

test('GET /playlists rejects unexpected query keys', async () => {
  const app = buildApp();
  const response = await request(app).get('/playlists?foo=bar');

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});
