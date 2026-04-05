# Library Module

The library module exposes authenticated, ownership-aware endpoints for browsing and searching a user's personal catalog data.

## Endpoints

- `GET /api/library/songs`
  - Query:
    - `filter`: `all | favorites | recent | uploads` (default `all`)
    - `page`: integer >= 1
    - `pageSize`: integer 1..100
    - `sortBy`: `createdAt | updatedAt | title`
    - `sortOrder`: `asc | desc`
    - `q`: optional search term for title, artist, or album
- `GET /api/library/songs/search`
  - Query:
    - required `q`
    - `page`, `pageSize`, `sortBy`, `sortOrder`
  - Behavior: dedicated song search endpoint (same ownership guards as list)
- `GET /api/library/songs/:songId`
  - Returns a single song detail if visible to the requesting user.
- `GET /api/library/search`
  - Query:
    - required `q`
    - `page`, `pageSize`, `sortOrder`
  - Returns grouped results for artists, albums, and playlists.
- `GET /api/library/summary`
  - Returns high-level counts for songs/uploads/favorites/recent/artists/albums/playlists.

## Ownership and Security

- All routes require authentication.
- Song visibility is scoped to user-related ownership/association paths:
  - uploaded by user
  - favorited by user
  - recently played by user
  - contained in user-owned playlists
- Song detail lookups return `404 SONG_NOT_FOUND` if not visible to the requester.

## Testing

- Route-level validation and auth wiring tests:
  - `backend/test/library/library.routes.test.js`
- Service behavior tests:
  - `backend/test/library/library.service.test.js`
