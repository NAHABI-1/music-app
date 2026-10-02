const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { getEnv } = require('./config/env');
const { apiRouter } = require('./routes');

function createApp() {
  const env = getEnv();
  const app = express();
  const allowedOrigins = new Set(env.app.allowedOrigins);

  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.has(origin)) {
          return callback(null, true);
        }

        return callback({
          statusCode: 403,
          code: 'CORS_ORIGIN_DENIED',
          message: 'Origin is not allowed by CORS policy.',
        });
      },
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan('dev'));

  app.get('/health', (_request, response) => {
    response.json({ ok: true, service: 'cloudtune-backend' });
  });

  app.use('/api/v1', apiRouter);

  app.use((error, _request, response, _next) => {
    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    const safeMessage = statusCode >= 500 ? 'Internal Server Error' : error?.message || 'Request failed';
    const payload = {
      error: safeMessage,
      code: error.code || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
    };

    if (Array.isArray(error.details) && statusCode < 500) {
      payload.details = error.details;
    }

    if (statusCode >= 500) {
      console.error('[UNHANDLED_ERROR]', {
        message: error?.message,
        code: error?.code,
      });
    }

    response.status(statusCode).json(payload);
  });

  return app;
}

module.exports = { createApp };