const express = require('express');

const { requireAuth } = require('../auth/auth.middleware');
const { createPlaybackController } = require('./playback.controller');
const {
  validateBody,
  validateQuery,
  validateParams,
  startPlaybackSessionSchema,
  updatePlaybackProgressSchema,
  endPlaybackSessionSchema,
  sessionPathSchema,
  songPathSchema,
  listEventsQuerySchema,
} = require('./playback.schemas');

function createPlaybackRouter(options = {}) {
  const router = express.Router();
  const authGuard = options.requireAuth || requireAuth;
  const controller = options.controller || createPlaybackController();

  router.post('/sessions', authGuard(), validateBody(startPlaybackSessionSchema), controller.startSession);
  router.get('/sessions/:sessionId', authGuard(), validateParams(sessionPathSchema), controller.getSession);
  router.patch(
    '/sessions/:sessionId/progress',
    authGuard(),
    validateParams(sessionPathSchema),
    validateBody(updatePlaybackProgressSchema),
    controller.updateProgress
  );
  router.post(
    '/sessions/:sessionId/end',
    authGuard(),
    validateParams(sessionPathSchema),
    validateBody(endPlaybackSessionSchema),
    controller.endSession
  );
  router.get(
    '/resume/:songId',
    authGuard(),
    validateParams(songPathSchema),
    validateQuery(listEventsQuerySchema),
    controller.getResume
  );

  return router;
}

module.exports = {
  createPlaybackRouter,
};
