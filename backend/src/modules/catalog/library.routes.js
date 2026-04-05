const express = require('express');

const { requireAuth } = require('../auth/auth.middleware');
const { createLibraryController } = require('./library.controller');
const {
  validateQuery,
  listSongsQuerySchema,
  searchSongsQuerySchema,
  searchCollectionsQuerySchema,
} = require('./library.schemas');

function createLibraryRouter(options = {}) {
  const router = express.Router();
  const authGuard = options.requireAuth || requireAuth;
  const controller = options.controller || createLibraryController();

  router.get('/songs', authGuard(), validateQuery(listSongsQuerySchema), controller.listSongs);
  router.get('/songs/search', authGuard(), validateQuery(searchSongsQuerySchema), controller.searchSongs);
  router.get('/songs/:songId', authGuard(), controller.songDetail);
  router.get('/search', authGuard(), validateQuery(searchCollectionsQuerySchema), controller.searchCollections);
  router.get('/summary', authGuard(), controller.summary);

  return router;
}

module.exports = {
  createLibraryRouter,
};
