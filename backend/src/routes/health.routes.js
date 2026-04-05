const express = require('express');

const healthRouter = express.Router();

healthRouter.get('/', (_request, response) => {
  response.json({
    ok: true,
    service: 'cloudtune-api',
    features: ['backend-scaffold', 'postgres-ready', 'storage-ready'],
  });
});

module.exports = { healthRouter };