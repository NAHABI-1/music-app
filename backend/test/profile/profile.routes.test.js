const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

const { createProfileRouter } = require('../../src/modules/profile/profile.routes');

function createStubController() {
  return {
    getCurrentProfile: (_req, res) => {
      res.status(200).json({ id: 'user-1', profile: { displayName: 'Stub User' } });
    },
    updateCurrentProfile: (req, res) => {
      res.status(200).json({
        id: 'user-1',
        profile: {
          displayName: req.validatedBody.displayName || 'Stub User',
        },
      });
    },
  };
}

function buildApp() {
  const app = express();
  app.use(express.json());

  const fakeRequireAuth = () => (req, _res, next) => {
    req.auth = { userId: 'user-1', role: 'USER', email: 'user@example.com' };
    next();
  };

  app.use('/profile', createProfileRouter({ requireAuth: fakeRequireAuth, controller: createStubController() }));

  app.use((err, _req, res, _next) => {
    res.status(err.statusCode || 500).json({ code: err.code || 'ERR', error: err.message });
  });

  return app;
}

test('GET /me returns current profile', async () => {
  const app = buildApp();
  const response = await request(app).get('/profile/me');

  assert.equal(response.status, 200);
  assert.equal(response.body.profile.displayName, 'Stub User');
});

test('PATCH /me validates payload', async () => {
  const app = buildApp();
  const response = await request(app).patch('/profile/me').send({ displayName: 'A' });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('PATCH /me updates profile with valid payload', async () => {
  const app = buildApp();
  const response = await request(app)
    .patch('/profile/me')
    .send({
      displayName: 'Updated User',
      notificationPreferences: {
        pushNotificationsEnabled: false,
      },
      emailPreferences: {
        emailMarketingEnabled: true,
      },
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.profile.displayName, 'Updated User');
});
