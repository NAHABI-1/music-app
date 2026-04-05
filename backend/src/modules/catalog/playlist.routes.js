const express = require('express');

const { requireAuth } = require('../auth/auth.middleware');
const { createPlaylistController } = require('./playlist.controller');
const {
  validateBody,
  validateQuery,
  validateParams,
  listPlaylistsQuerySchema,
  createPlaylistSchema,
  renamePlaylistSchema,
  addSongToPlaylistSchema,
  reorderPlaylistItemsSchema,
  playlistPathParamsSchema,
  songPathParamsSchema,
} = require('./playlist.schemas');

function createPlaylistRouter(options = {}) {
  const router = express.Router();
  const authGuard = options.requireAuth || requireAuth;
  const controller = options.controller || createPlaylistController();

  router.get('/', authGuard(), validateQuery(listPlaylistsQuerySchema), controller.listUserPlaylists);
  router.post('/', authGuard(), validateBody(createPlaylistSchema), controller.createPlaylist);

  router.get('/:playlistId', authGuard(), validateParams(playlistPathParamsSchema), controller.getPlaylistDetail);
  router.patch(
    '/:playlistId',
    authGuard(),
    validateParams(playlistPathParamsSchema),
    validateBody(renamePlaylistSchema),
    controller.renamePlaylist
  );
  router.delete('/:playlistId', authGuard(), validateParams(playlistPathParamsSchema), controller.deletePlaylist);

  router.post(
    '/:playlistId/items',
    authGuard(),
    validateParams(playlistPathParamsSchema),
    validateBody(addSongToPlaylistSchema),
    controller.addSongToPlaylist
  );
  router.delete(
    '/:playlistId/items/:songId',
    authGuard(),
    validateParams(songPathParamsSchema),
    controller.removeSongFromPlaylist
  );
  router.patch(
    '/:playlistId/items/reorder',
    authGuard(),
    validateParams(playlistPathParamsSchema),
    validateBody(reorderPlaylistItemsSchema),
    controller.reorderPlaylistItems
  );

  return router;
}

module.exports = {
  createPlaylistRouter,
};
