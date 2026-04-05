const express = require('express');

const { requireAuth } = require('../auth/auth.middleware');
const { createInteractionController } = require('./interaction.controller');
const {
  validateQuery,
  validateParams,
  validateBody,
  listQuerySchema,
  songPathParamsSchema,
  trackRecentPlaySchema,
} = require('./interaction.schemas');

function createInteractionRouter(options = {}) {
  const router = express.Router();
  const authGuard = options.requireAuth || requireAuth;
  const controller = options.controller || createInteractionController();

  router.post('/songs/:songId/favorite', authGuard(), validateParams(songPathParamsSchema), controller.likeSong);
  router.delete('/songs/:songId/favorite', authGuard(), validateParams(songPathParamsSchema), controller.unlikeSong);
  router.get('/favorites', authGuard(), validateQuery(listQuerySchema), controller.listFavorites);

  router.post('/recently-played', authGuard(), validateBody(trackRecentPlaySchema), controller.trackRecentlyPlayed);
  router.get('/recently-played', authGuard(), validateQuery(listQuerySchema), controller.listRecentlyPlayed);

  return router;
}

module.exports = {
  createInteractionRouter,
};
