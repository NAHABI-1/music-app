# Authentication Module

CloudTune backend authentication includes email/password auth, JWT access tokens, refresh-session rotation, role middleware, and social auth scaffolds.

## Implemented Endpoints

Base path: `/api/v1/auth`

- `POST /signup`
  - Creates a user account and profile.
  - Returns access token + refresh token.
- `POST /login`
  - Validates email/password credentials.
  - Returns access token + refresh token.
- `POST /refresh`
  - Rotates refresh token using persisted auth session.
  - Returns new access token + refresh token.
- `POST /logout`
  - Revokes active session associated with refresh token.
  - Idempotent response.
- `GET /me`
  - Requires access token.
  - Returns authenticated user context.
- `GET /admin/ping`
  - Requires access token + `ADMIN` role.
  - Role-scaffold endpoint for future admin APIs.
- `POST /social/google`
  - Scaffold endpoint. Returns not-configured / not-implemented scaffold responses.
- `POST /social/apple`
  - Scaffold endpoint. Returns not-configured / not-implemented scaffold responses.

## Token Strategy

- Access token: JWT signed with `JWT_SECRET`
- Refresh token: JWT signed with `REFRESH_TOKEN_SECRET`
- Session persistence: `auth_sessions` table
- Refresh token storage: SHA-256 hash only (never plaintext)
- Refresh token rotation: enabled on each `/refresh`

## Password Security

- Passwords are hashed with bcrypt (`AUTH_PASSWORD_HASH_ROUNDS`)
- Login responses use generic credential errors to reduce account enumeration risk

## Validation and Error Shape

- Zod request validation on auth payloads
- Standard error response:
  - `error`: user-safe error message
  - `code`: stable error code
  - `details`: validation details where appropriate

## Social Auth Scaffold

Social auth is scaffolded with environment flags:

- `AUTH_SOCIAL_GOOGLE_ENABLED`
- `AUTH_SOCIAL_GOOGLE_CLIENT_ID`
- `AUTH_SOCIAL_APPLE_ENABLED`
- `AUTH_SOCIAL_APPLE_SERVICE_ID`

Provider token verification is intentionally not implemented yet and returns explicit scaffold errors.

## Tests

- `backend/test/auth/auth.service.test.js`
- `backend/test/auth/auth.routes.test.js`

Run all backend tests:

```bash
npm --prefix backend test
```
