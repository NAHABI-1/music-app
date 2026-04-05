# Offline Download Entitlement Module

This module manages secure offline access requests and entitlement validation per user/device/session.

## Endpoints

- `POST /api/v1/offline/requests`
  - Body: `songId`, `deviceSessionId`, optional `preferredQuality`, optional `lowDataMode`
  - Creates or reuses an offline download record after ownership, eligibility, and limit checks.
- `PATCH /api/v1/offline/downloads/:downloadId/status`
  - Body: `status` (`DOWNLOADING|READY|FAILED`), optional `localPath`, optional `downloadProgressPct`, optional `errorReason`
  - Tracks download lifecycle from device.
- `GET /api/v1/offline/downloads`
  - Query: optional `deviceSessionId`, optional `status`
  - Lists user offline download records.
- `GET /api/v1/offline/entitlements/:songId?deviceSessionId=...`
  - Validates whether song is currently entitled for offline playback on specific device session.
- `DELETE /api/v1/offline/downloads/:downloadId`
  - Revokes an offline download record (status -> `DELETED`).
- `POST /api/v1/offline/maintenance/expire`
  - Marks overdue offline records as `EXPIRED` (scaffolded maintenance operation).

## Security and Entitlement Rules

- User must own/have access to song through library ownership graph.
- Song must be stream-ready (`Song.status=READY`) and not rights-rejected.
- Device session must exist and be active for the requesting user.
- Entitlement is not granted by request alone: file must be downloaded/cached and marked `READY` with concrete device `localPath`.

## Plan-aware Limits

- Free tier: capped offline active downloads (`QUEUED|DOWNLOADING|READY`) at service-level free limit.
- Premium tier: higher service-level limit.
- Tier inferred from active/trialing subscription + plan code.

## Notes

- This is backend entitlement/tracking only and does not include local device file transfer logic.
- Client must complete device-side download/caching and report status transitions to backend.
