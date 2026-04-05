# Profile Module

CloudTune backend profile module manages user profile data and communication preferences.

## Endpoints

Base path: `/api/v1/profile`

- `GET /me`
  - Requires authentication
  - Returns current user's profile and preference settings
- `PATCH /me`
  - Requires authentication
  - Updates profile and preference fields

## Supported Profile Fields

- `displayName`
- `bio`
- `countryCode`
- `dateOfBirth`
- `avatarUrl`
- `avatarStorageKey`
- `avatarMetadata`
- `profileMetadata`

## Notification and Email Preferences

- Notification preferences:
  - `inAppNotificationsEnabled`
  - `pushNotificationsEnabled`
  - `emailNotificationsEnabled`
  - `notificationTopics` (metadata object)
- Email preferences:
  - `emailMarketingEnabled`
  - `emailProductUpdatesEnabled`
  - `emailSecurityAlertsEnabled`

## Layering

- DTO and validation schemas:
  - `backend/src/modules/profile/profile.schemas.js`
- Service layer:
  - `backend/src/modules/profile/profile.service.js`
- Repository methods:
  - `backend/src/repositories/profile.repository.js`
- Routes and controller:
  - `backend/src/modules/profile/profile.routes.js`
  - `backend/src/modules/profile/profile.controller.js`

## Tests

- `backend/test/profile/profile.service.test.js`
- `backend/test/profile/profile.routes.test.js`
