const express = require('express');

const { requireAuth } = require('../auth/auth.middleware');
const { createProfileController } = require('./profile.controller');
const { updateProfileSchema, validateBody } = require('./profile.schemas');

function createProfileRouter(options = {}) {
  const router = express.Router();
  const authGuard = options.requireAuth || requireAuth;
  const controller = options.controller || createProfileController();

  router.get('/me', authGuard(), controller.getCurrentProfile);
  router.patch('/me', authGuard(), validateBody(updateProfileSchema), controller.updateCurrentProfile);

  return router;
}

module.exports = {
  createProfileRouter,
};
