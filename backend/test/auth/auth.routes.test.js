const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

const { createAuthRouter } = require('../../src/modules/auth/auth.routes');

function createStubController() {
  return {
    signup: (req, res) => res.status(201).json({ ok: true, route: 'signup', email: req.validatedBody.email }),
    login: (req, res) => res.status(200).json({ ok: true, route: 'login', email: req.validatedBody.email }),
    refresh: (_req, res) => res.status(200).json({ ok: true, route: 'refresh' }),
    logout: (_req, res) => res.status(200).json({ ok: true, route: 'logout' }),
    me: (_req, res) => res.status(200).json({ ok: true, route: 'me' }),
    socialGoogle: (_req, res) => res.status(200).json({ ok: true, route: 'google' }),
    socialApple: (_req, res) => res.status(200).json({ ok: true, route: 'apple' }),
  };
}

function createAppWithRouter() {
  const app = express();
  app.use(express.json());

  const fakeRequireAuth = () => (req, _res, next) => {
    req.auth = { userId: 'u1', role: 'ADMIN', email: 'admin@example.com' };
    next();
  };

  const fakeRequireRole = () => (_req, _res, next) => next();

  app.use(
    '/auth',
    createAuthRouter({
      controller: createStubController(),
      requireAuth: fakeRequireAuth,
      requireRole: fakeRequireRole,
    })
  );

  app.use((err, _req, res, _next) => {
    res.status(err.statusCode || 500).json({ code: err.code || 'ERR', error: err.message });
  });

  return app;
}

test('signup route validates payload', async () => {
  const app = createAppWithRouter();
  const response = await request(app).post('/auth/signup').send({ email: 'bad-email', password: '123' });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('login route accepts valid payload', async () => {
  const app = createAppWithRouter();
  const response = await request(app).post('/auth/login').send({
    email: 'user@example.com',
    password: 'ValidPass1',
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.route, 'login');
});

test('me route enforces auth middleware chain', async () => {
  const app = createAppWithRouter();
  const response = await request(app).get('/auth/me');

  assert.equal(response.status, 200);
  assert.equal(response.body.route, 'me');
});
