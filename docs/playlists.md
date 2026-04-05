# Playlists Module

The playlists module manages authenticated, ownership-scoped playlist operations with stable item ordering.

## Endpoints

- `GET /api/v1/playlists`
  - Query: `page`, `pageSize`
  - Returns current user's active playlists.
- `POST /api/v1/playlists`
  - Body: `title`, optional `description`
  - Creates a private active playlist for the authenticated user.
- `GET /api/v1/playlists/:playlistId`
  - Returns playlist detail with ordered items and song metadata.
- `PATCH /api/v1/playlists/:playlistId`
  - Body: `title`
  - Renames the playlist.
- `DELETE /api/v1/playlists/:playlistId`
  - Soft-deletes the playlist by setting status to `DELETED`.
- `POST /api/v1/playlists/:playlistId/items`
  - Body: `songId`, optional `position`
  - Adds a song into playlist ordering, shifting later positions.
- `DELETE /api/v1/playlists/:playlistId/items/:songId`
  - Removes the song from playlist and compacts ordering.
- `PATCH /api/v1/playlists/:playlistId/items/reorder`
  - Body: `itemIds` (all playlist item IDs exactly once)
  - Reorders items transactionally.

## Ownership and Safety

- All operations require authentication.
- Playlist ownership is enforced on every mutating and read action.
- Songs can only be added if visible in the user's owned library scope.
- Reorder requires a complete and exact item-id set to prevent partial corrupt ordering.

## Ordering Semantics

- Positions are 1-based and contiguous.
- Insert at position shifts existing items at and after position.
- Remove compacts subsequent positions.
- Reorder uses a two-phase transactional update with temporary offsets to avoid unique-position conflicts.

## Tests

- Route tests: `backend/test/playlist/playlist.routes.test.js`
- Service tests: `backend/test/playlist/playlist.service.test.js`
