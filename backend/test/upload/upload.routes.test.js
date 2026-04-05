const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

const { createUploadRouter } = require('../../src/modules/media/upload.routes');

function createStubController() {
  return {
    initiateUpload: (_req, res) => res.status(201).json({ ok: true, route: 'initiate' }),
    getUpload: (_req, res) => res.status(200).json({ ok: true, route: 'get' }),
    updateProgress: (_req, res) => res.status(200).json({ ok: true, route: 'progress' }),
    completeUpload: (_req, res) => res.status(200).json({ ok: true, route: 'complete' }),
    createAccessUrl: (_req, res) => res.status(200).json({ ok: true, route: 'access' }),
  };
}

function buildApp() {
  const app = express();
  app.use(express.json());

  const fakeRequireAuth = () => (req, _res, next) => {
    req.auth = { userId: 'user-1', role: 'USER', email: 'user@example.com' };
    next();
  };

  app.use('/uploads', createUploadRouter({ requireAuth: fakeRequireAuth, controller: createStubController() }));

  app.use((err, _req, res, _next) => {
    res.status(err.statusCode || 500).json({ code: err.code || 'ERR', error: err.message });
  });

  return app;
}

test('POST /uploads validates initiate payload', async () => {
  const app = buildApp();
  const response = await request(app).post('/uploads').send({ filename: 'song.mp3' });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('POST /uploads accepts valid initiate payload', async () => {
  const app = buildApp();
  const response = await request(app).post('/uploads').send({
    filename: 'song.mp3',
    mimeType: 'audio/mpeg',
    fileSizeBytes: 4096,
    legalAttestationAccepted: true,
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.route, 'initiate');
});

test('PATCH /uploads/:id/progress validates progress payload', async () => {
  const app = buildApp();
  const response = await request(app).patch('/uploads/u1/progress').send({ uploadedBytes: -1 });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('POST /uploads/:id/complete accepts optional metadata hints', async () => {
  const app = buildApp();
  const response = await request(app).post('/uploads/u1/complete').send({
    checksumSha256: 'a'.repeat(64),
    metadataHints: {
      title: 'Song',
      artistName: 'Artist',
      durationSeconds: 120,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.route, 'complete');
});
