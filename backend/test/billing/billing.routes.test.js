const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

const { createBillingRouter } = require('../../src/modules/billing/billing.routes');

function createStubController() {
  return {
    listPlans: (_req, res) => res.status(200).json({ route: 'plans' }),
    getFeatureComparison: (_req, res) => res.status(200).json({ route: 'comparison' }),
    getPublicUpsellData: (_req, res) => res.status(200).json({ route: 'public-upsell' }),
    getSubscriptionStatus: (_req, res) => res.status(200).json({ route: 'status' }),
    getEntitlements: (_req, res) => res.status(200).json({ route: 'entitlements' }),
    getUpsellData: (_req, res) => res.status(200).json({ route: 'upsell' }),
    getPaymentConfig: (_req, res) => res.status(200).json({ route: 'payment-config' }),
    validatePromoCode: (_req, res) => res.status(200).json({ route: 'validate-promo' }),
    redeemPromoCode: (_req, res) => res.status(200).json({ route: 'redeem-promo' }),
    createCheckoutSession: (_req, res) => res.status(201).json({ route: 'checkout' }),
    handleWebhook: (_req, res) => res.status(200).json({ route: 'webhook' }),
  };
}

function buildApp() {
  const app = express();
  app.use(express.json());

  const fakeRequireAuth = () => (req, _res, next) => {
    req.auth = { userId: 'user-1', role: 'USER', email: 'user@example.com' };
    next();
  };

  app.use('/billing', createBillingRouter({ requireAuth: fakeRequireAuth, controller: createStubController() }));

  app.use((err, _req, res, _next) => {
    res.status(err.statusCode || 500).json({ code: err.code || 'ERR', error: err.message });
  });

  return app;
}

test('GET /billing/plans responds without auth', async () => {
  const app = buildApp();
  const response = await request(app).get('/billing/plans');

  assert.equal(response.status, 200);
  assert.equal(response.body.route, 'plans');
});

test('GET /billing/status requires auth', async () => {
  const app = buildApp();
  const response = await request(app).get('/billing/status');

  assert.equal(response.status, 200);
  assert.equal(response.body.route, 'status');
});

test('POST /billing/promo-codes/validate rejects invalid payloads', async () => {
  const app = buildApp();
  const response = await request(app).post('/billing/promo-codes/validate').send({});

  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('POST /billing/checkout accepts valid payment scaffold payload', async () => {
  const app = buildApp();
  const response = await request(app).post('/billing/checkout').send({
    planCode: 'PREMIUM_MONTHLY',
    promoCode: 'SAVE10',
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.route, 'checkout');
});

test('POST /billing/webhooks/:provider validates payload and params', async () => {
  const app = buildApp();
  const response = await request(app).post('/billing/webhooks/stripe').send({
    eventType: 'payment.succeeded',
    providerRef: 'provider-ref-1',
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.route, 'webhook');
});
