const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

const { healthRouter } = require('../../src/routes/health.routes');

test('GET /api/v1/health returns API health payload', async () => {
  const app = express();
  app.use('/api/v1/health', healthRouter);

  const response = await request(app).get('/api/v1/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.service, 'cloudtune-api');
});

