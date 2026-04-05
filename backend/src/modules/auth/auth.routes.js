const express = require('express');

const { createAuthController } = require('./auth.controller');
const {
  signupSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  socialAuthSchema,
  validateBody,
} = require('./auth.schemas');
const { requireAuth, requireRole } = require('./auth.middleware');

function createAuthRouter(options = {}) {
  const router = express.Router();
  const authController = options.controller || createAuthController();
  const authGuard = options.requireAuth || requireAuth;
  const roleGuard = options.requireRole || requireRole;

  router.post('/signup', validateBody(signupSchema), authController.signup);
  router.post('/login', validateBody(loginSchema), authController.login);
  router.post('/refresh', validateBody(refreshSchema), authController.refresh);
  router.post('/logout', validateBody(logoutSchema), authController.logout);

  router.post('/social/google', validateBody(socialAuthSchema), authController.socialGoogle);
  router.post('/social/apple', validateBody(socialAuthSchema), authController.socialApple);

  router.get('/me', authGuard(), authController.me);

  // Admin role scaffold route for future admin control panel features.
  router.get('/admin/ping', authGuard(), roleGuard('ADMIN'), (_request, response) => {
    response.status(200).json({ ok: true, scope: 'admin' });
  });

  return router;
}

module.exports = { createAuthRouter };
