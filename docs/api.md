# Website Integration API (Vertical Slice)

Base URL: `http://localhost:4000/api/v1`  
Versioning: all website endpoints are served under `/api/v1`.

## 1) Local setup (backend source of truth)

From repository root:

```bash
cp .env.example .env
docker compose up --build
```

Then initialize Prisma from `backend/` (first run and after schema changes):

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev
```

Required env highlights for website integration:

- `APP_ALLOWED_ORIGINS` (comma-separated allowed website origins)
- `JWT_SECRET`, `REFRESH_TOKEN_SECRET`
- `DATABASE_URL`
- `STORAGE_*` and `PLAYBACK_SIGNED_URL_TTL_SECONDS` (for signed playback/access URLs)

## 2) CORS behavior

- CORS is strict allow-list based from `APP_ALLOWED_ORIGINS`.
- Browser origins not in allow-list are rejected with:
  - `403`
  - `code: "CORS_ORIGIN_DENIED"`
- Non-browser/server requests without an `Origin` header are allowed.

Example:

```env
APP_ALLOWED_ORIGINS=http://localhost:3000,https://www.example.com
```

## 3) Error format

All endpoints return:

```json
{
  "error": "User-safe message",
  "code": "STABLE_ERROR_CODE",
  "details": []
}
```

`details` is present for non-5xx validation/contract errors.

## 4) Endpoint contract for website vertical slice

### Health

- `GET /health`
- Auth: none
- 200 example:

```json
{
  "ok": true,
  "service": "cloudtune-api",
  "features": ["backend-scaffold", "postgres-ready", "storage-ready"]
}
```

### Authentication

Base path: `/auth`

- `POST /signup`
- `POST /login`
- `POST /refresh`
- `POST /logout`
- `GET /me` (requires `Authorization` header)

`POST /signup` request example:

```json
{
  "email": "user@example.com",
  "password": "ValidPass1",
  "displayName": "Example User"
}
```

`POST /login` response example:

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "tokenType": "Bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER",
    "status": "ACTIVE",
    "displayName": "Example User"
  }
}
```

### Library and song browsing

Base path: `/library` (requires `Authorization` header)

- `GET /songs`
- `GET /songs/search`
- `GET /songs/:songId`
- `GET /search`
- `GET /summary`

`GET /songs` query:

- `filter`: `all|favorites|recent|uploads` (default `all`)
- `page`: integer >= 1
- `pageSize`: integer 1..100
- `sortBy`: `createdAt|updatedAt|title`
- `sortOrder`: `asc|desc`
- `q`: optional

### Secure playback/access URLs (supported endpoints)

#### Playback stream URL

Base path: `/playback` (requires `Authorization` header)

- `POST /sessions` (creates playback session and returns short-lived signed stream URL)

Request example:

```json
{
  "songId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "quality": "AUTO",
  "lowDataMode": false,
  "playbackSource": "STREAM"
}
```

Response excerpt:

```json
{
  "session": { "id": "uuid", "songId": "uuid", "status": "ACTIVE" },
  "stream": {
    "strategy": "SIGNED_URL",
    "url": "https://...",
    "method": "GET",
    "expiresAt": "2026-01-01T00:00:00.000Z"
  }
}
```

#### Upload owner access URL

Base path: `/uploads` (requires `Authorization` header)

- `POST /:uploadId/access-url` (owner-scoped signed access URL)

Request example:

```json
{
  "download": false
}
```

## 5) Fetch examples (website)

```js
const baseUrl = 'http://localhost:4000/api/v1';

const health = await fetch(`${baseUrl}/health`).then((r) => r.json());

const login = await fetch(`${baseUrl}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'ValidPass1' }),
}).then((r) => r.json());

const songs = await fetch(`${baseUrl}/library/songs?page=1&pageSize=20`, {
  headers: { Authorization: 'Token <accessToken>' },
}).then((r) => r.json());
```
