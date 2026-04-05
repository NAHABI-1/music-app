# CloudTune

CloudTune is a full-stack music platform project with:

- `backend/`: Node.js + Express + Prisma API
- `mobile/`: Flutter client app
- `database/`: SQL/bootstrap database assets
- `docs/`: implementation notes

This repository includes authentication, library/playlists, uploads, offline entitlement flows, notifications, ads, billing, analytics, and admin APIs, plus a Flutter app scaffold wired to those product domains.

## Setup Instructions

### 1. Prerequisites

- Node.js 20+
- npm 10+
- Docker + Docker Compose
- Flutter SDK (3.22+ recommended)
- Dart SDK (bundled with Flutter)

### 2. Clone and install dependencies

From the repository root:

```bash
cd backend
npm install

cd ../mobile
flutter pub get
```

### 3. Prepare environment

At repository root:

```bash
cp .env.example .env
```

Update secrets and provider values in `.env` before running in non-local environments.

## Environment Setup

CloudTune uses a single root `.env` file consumed by backend/runtime tooling.

High-impact variables:

- App/runtime: `NODE_ENV`, `APP_ENV`, `BACKEND_HOST`, `BACKEND_PORT`, `APP_ALLOWED_ORIGINS`
- Auth: `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, token TTL values
- Database: `DATABASE_URL`, `POSTGRES_*`, pool sizing fields
- Storage: `STORAGE_PROVIDER`, `STORAGE_*`, signed URL TTL
- Audio: `AUDIO_MAX_UPLOAD_MB`, `AUDIO_ALLOWED_MIME_TYPES`, `AUDIO_OFFLINE_TTL_HOURS`
- Premium/billing: `SUBSCRIPTIONS_*`
- Ads: `ADS_*`
- Analytics: `ANALYTICS_*`
- Flutter backend URL default: `FLUTTER_API_BASE_URL`

Validation is enforced in backend env schema. Invalid/missing required combinations fail fast on startup.

## Backend Run Instructions

### Local with Node

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev
```

Backend default base URL: `http://0.0.0.0:4000`.
API prefix: `/api/v1`.

### Local with Docker Compose

From repository root:

```bash
docker compose up --build
```

This starts:

- PostgreSQL
- Redis
- MinIO
- Backend container (dev command)
- MailHog

## Flutter Run Instructions

```bash
cd mobile
flutter pub get
flutter run --dart-define=CLOUDTUNE_API_BASE_URL=http://localhost:4000
```

Production build example:

```bash
flutter build apk --release --dart-define=CLOUDTUNE_API_BASE_URL=https://api.example.com
```

The app reads API base URL from Dart define `CLOUDTUNE_API_BASE_URL` (see `mobile/lib/core/config/app_config.dart`).

## Storage Setup Guide

CloudTune storage abstraction currently uses S3-compatible semantics through `S3StorageProvider`.

### MinIO for local development

1. Start services via `docker compose up`.
2. Ensure `.env` uses:
	- `STORAGE_PROVIDER=minio`
	- `STORAGE_ENDPOINT=minio` (or localhost if running outside Docker network)
	- `STORAGE_PORT=9000`
	- `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY`
	- `STORAGE_BUCKET=cloudtune-media`
3. Create bucket in MinIO console (`http://localhost:9001`) if not auto-created by workflow.

### Production note

Set `STORAGE_PROVIDER=s3` and point to your cloud object storage endpoint/region/credentials. Keep signed URL TTL short and rotate credentials via secret manager.

## Premium and Ads Setup Notes

Premium subscriptions and ads are feature-gated by environment.

- Premium:
	- `SUBSCRIPTIONS_ENABLED=true|false`
	- Provider from `SUBSCRIPTIONS_PROVIDER` (`none`, `stripe`, `revenuecat`, `custom`)
	- Set webhook secret when provider is enabled
- Ads:
	- `ADS_ENABLED=true|false`
	- Provider from `ADS_PROVIDER` (`none`, `admob`, `applovin`, `custom`)
	- Configure app/unit IDs when enabled

When enabled with real providers, server-side validation enforces required keys and consistency.

## Offline Listening Explanation

Offline access is entitlement-driven and tied to user tier and device session:

1. Client requests offline access for a song.
2. Backend verifies song eligibility and active device session.
3. Backend checks plan tier offline limit and creates a queued download record.
4. Device downloads/caches file and sends status updates.
5. Entitlement validation ensures local file exists and record is ready/non-expired.

Offline limits and expiry behavior are controlled by plan entitlement logic and `AUDIO_OFFLINE_TTL_HOURS`.

## Upload Flow Explanation

Upload lifecycle:

1. Client calls upload initiation endpoint with file metadata and legal attestation.
2. Backend validates mime type and max size, creates upload record.
3. Backend returns signed upload URL and progress endpoints.
4. Client reports progress.
5. Completion endpoint finalizes metadata scaffold, creates/links song, and updates storage usage.
6. Signed access URL endpoint provides secure temporary retrieval.

All upload flows require authenticated user ownership checks.

## API Overview

Base URL: `http://localhost:4000/api/v1`

Core route groups:

- `/health`: health checks
- `/auth`: signup/login/refresh/logout/social auth/me
- `/profile`: current profile read/update
- `/library`: songs/search/collection summary
- `/playlists`: playlist CRUD and song membership
- `/interactions`: favorites and recently played
- `/uploads`: initiate/progress/complete/access URL
- `/offline`: request download, status, entitlement, revoke, expire
- `/billing`: plans, entitlements, checkout, promo validation/redeem
- `/ads`: feed/banner/rewarded/events + admin campaign controls
- `/notifications`: list/preferences/read-state/push scaffolds
- `/analytics`: event ingestion and user/admin summaries
- `/admin`: moderation, plans, promo codes, platform stats, notification broadcast

Authentication uses bearer tokens for protected routes. Admin routes require role checks.

## Project Structure Explanation

```text
.
├── backend
│   ├── prisma                 # Prisma schema, migrations, seeds
│   ├── src
│   │   ├── config             # env + storage/db configuration
│   │   ├── middleware         # auth + validation middleware
│   │   ├── modules            # domain modules (auth, media, billing, etc.)
│   │   ├── repositories       # persistence layer wrappers
│   │   ├── routes             # API route composition
│   │   └── services           # cross-cutting services
│   └── test                   # node:test + supertest suites
├── mobile
│   ├── lib
│   │   ├── app                # app shell, theme, routing, global scopes
│   │   ├── core               # shared models, config, repos, utilities
│   │   ├── features           # feature-first modules
│   │   └── shared             # reusable UI widgets
│   └── test                   # flutter test suites
├── database                   # database bootstrap/readme assets
├── docs                       # additional docs and implementation notes
├── docker-compose.yml         # local infrastructure stack
└── .env.example               # environment template
```

## Testing

Backend:

```bash
cd backend
npm test
```

Mobile:

```bash
cd mobile
flutter test
```

## Security and Deployment Notes

- Replace all placeholder secrets before deployment.
- Restrict CORS origins in staging/production.
- Use managed secrets and key rotation.
- Serve backend behind TLS and reverse proxy.
- Use short-lived signed URLs and enforce object ownership.