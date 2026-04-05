# Admin Module Documentation

## Overview

The Admin Module provides comprehensive administrative capabilities for managing users, content, promotions, plans, analytics, and notifications. All admin endpoints require authentication and ADMIN role authorization.

## Base URL

```
/api/admin
```

## Authentication

All endpoints require:
1. Valid Bearer token in `Authorization` header
2. User role must be `ADMIN`

```
Authorization: Bearer <access_token>
```

## Response Format

All responses follow a consistent format:

### Success Response
```json
{
  "data": { /* endpoint-specific data */ },
  "meta": { /* optional metadata */ }
}
```

### Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "statusCode": 400,
    "details": { /* optional error details */ }
  }
}
```

---

## User Management Endpoints

### Get All Users

```
GET /api/admin/users
```

**Query Parameters:**
- `page` (integer): Page number, default 1
- `limit` (integer): Results per page, max 100, default 20
- `search` (string): Search by email or display name
- `sort` (string): 'asc' or 'desc', default 'desc'
- `sortBy` (string): Field to sort by, default 'createdAt'

**Response:**
```json
{
  "data": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "role": "USER",
      "status": "ACTIVE",
      "createdAt": "2024-01-01T00:00:00Z",
      "profile": {
        "displayName": "John Doe",
        "avatarUrl": "https://..."
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Get User Details

```
GET /api/admin/users/:userId
```

**Response:**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "role": "USER",
  "status": "ACTIVE",
  "profile": { /* full profile object */ },
  "subscriptions": [ /* active subscriptions */ ],
  "uploads": [ /* recent uploads */ ],
  "_count": {
    "songsUploaded": 10,
    "playlists": 5,
    "favorites": 20,
    "recentPlays": 150
  }
}
```

### Suspend User

```
POST /api/admin/users/:userId/suspend
```

**Request Body:**
```json
{
  "reason": "Violation of terms of service",
  "duration": 30
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "status": "SUSPENDED"
  },
  "reason": "Violation of terms of service"
}
```

### Activate User

```
POST /api/admin/users/:userId/activate
```

**Request Body:**
```json
{
  "reason": "Optional reason for activation"
}
```

### Delete User

```
DELETE /api/admin/users/:userId
```

**Request Body:**
```json
{
  "reason": "Reason for deletion",
  "anonymize": true
}
```

If `anonymize` is true, user data is anonymized instead of permanently deleted.

### Update User Role

```
PATCH /api/admin/users/:userId/role
```

**Request Body:**
```json
{
  "role": "ADMIN"
}
```

---

## Content Moderation Endpoints

### Get Uploads for Review

```
GET /api/admin/moderation/uploads
```

**Query Parameters:**
- `page` (integer): Page number, default 1
- `limit` (integer): Results per page, default 20
- `sort` (string): 'asc' or 'desc', default 'asc'

**Response:**
```json
{
  "data": [
    {
      "id": "upload-uuid",
      "userId": "user-uuid",
      "status": "PROCESSING",
      "songs": [ /* songs in upload */ ],
      "user": {
        "email": "user@example.com",
        "profile": { "displayName": "John Doe" }
      }
    }
  ],
  "pagination": { /* pagination info */ }
}
```

### Review Upload

```
POST /api/admin/moderation/uploads/:uploadId/review
```

**Request Body:**
```json
{
  "status": "APPROVED",
  "moderationNotes": "Content approved after review",
  "actionItems": ["Add copyright notice"]
}
```

**Status Options:**
- `APPROVED` - Upload and associated songs are marked as ready
- `REJECTED` - Upload is rejected and songs are blocked

### Block Song

```
POST /api/admin/moderation/songs/:songId/block
```

**Request Body:**
```json
{
  "reason": "COPYRIGHTED",
  "details": "Song contains copyrighted material from...",
  "permanent": true,
  "notifyUploader": true
}
```

**Reason Options:**
- `COPYRIGHTED` - Copyright infringement
- `EXPLICIT` - Explicit content policy violation
- `OFFENSIVE` - Offensive content
- `LOW_QUALITY` - Quality standards not met
- `OTHER` - Other reason

### Unblock Song

```
POST /api/admin/moderation/songs/:songId/unblock
```

**Request Body:**
```json
{
  "reason": "Appeal approved, content re-evaluated"
}
```

---

## Promo Code Management Endpoints

### Get All Promo Codes

```
GET /api/admin/promo-codes
```

**Query Parameters:**
- `page` (integer): Page number, default 1
- `limit` (integer): Results per page, default 20
- `isActive` (boolean): Filter by active status

### Create Promo Code

```
POST /api/admin/promo-codes
```

**Request Body:**
```json
{
  "code": "SUMMER2024",
  "description": "Summer promotional offer",
  "discountType": "PERCENT",
  "discountValue": 20,
  "maxRedemptions": 1000,
  "expiresAt": "2024-08-31T23:59:59Z",
  "startsAt": "2024-06-01T00:00:00Z"
}
```

**Discount Types:**
- `PERCENT` - Percentage discount (0-100)
- `FIXED` - Fixed amount discount

### Update Promo Code

```
PATCH /api/admin/promo-codes/:codeId
```

**Request Body:**
```json
{
  "description": "Updated description",
  "isActive": false,
  "maxRedemptions": 500,
  "expiresAt": "2024-09-30T23:59:59Z"
}
```

### Delete Promo Code

```
DELETE /api/admin/promo-codes/:codeId
```

---

## Plan Management Endpoints

### Get All Plans

```
GET /api/admin/plans
```

**Query Parameters:**
- `isActive` (boolean): Filter by active status

**Response:**
```json
[
  {
    "id": "plan-uuid",
    "code": "PREMIUM_MONTHLY",
    "name": "Premium Monthly",
    "description": "Full access to premium features",
    "interval": "MONTHLY",
    "priceCents": 999,
    "currency": "USD",
    "isActive": true,
    "_count": {
      "subscriptions": 150
    }
  }
]
```

### Create Plan

```
POST /api/admin/plans
```

**Request Body:**
```json
{
  "code": "PREMIUM_YEARLY",
  "name": "Premium Yearly",
  "description": "Full year access to premium features",
  "interval": "YEARLY",
  "priceCents": 9999,
  "currency": "USD",
  "isActive": true
}
```

**Interval Options:**
- `MONTHLY` - Monthly billing
- `YEARLY` - Annual billing
- `LIFETIME` - One-time lifetime access

### Update Plan

```
PATCH /api/admin/plans/:planId
```

**Request Body:**
```json
{
  "name": "Premium Yearly Pro",
  "description": "Updated description",
  "priceCents": 10999,
  "currency": "USD",
  "isActive": true
}
```

### Delete Plan

```
DELETE /api/admin/plans/:planId
```

**Note:** Cannot delete plans with active subscriptions.

---

## Analytics & Reporting Endpoints

### Get Dashboard Statistics

```
GET /api/admin/analytics/dashboard
```

**Query Parameters:**
- `startDate` (required): ISO 8601 datetime
- `endDate` (required): ISO 8601 datetime

**Response:**
```json
{
  "totalUsers": 1500,
  "activeUsers": 45,
  "totalPlays": 50000,
  "totalRevenue": 150000,
  "totalSubscriptions": 250,
  "periodStart": "2024-01-01T00:00:00Z",
  "periodEnd": "2024-01-31T23:59:59Z"
}
```

### Get User Growth Metrics

```
GET /api/admin/analytics/user-growth
```

**Query Parameters:**
- `startDate` (required): ISO 8601 datetime
- `endDate` (required): ISO 8601 datetime
- `breakdown` (string): 'DAILY', 'WEEKLY', 'MONTHLY', default 'DAILY'

**Response:**
```json
[
  {
    "period": "2024-01-01",
    "signups": 50,
    "total": 1000
  },
  {
    "period": "2024-01-02",
    "signups": 45,
    "total": 1045
  }
]
```

---

## Notification Endpoints

### Send Notification

```
POST /api/admin/notifications/send
```

**Request Body:**
```json
{
  "recipientType": "SEGMENT",
  "segment": "PREMIUM_USERS",
  "title": "New Feature Available",
  "message": "Check out our new feature...",
  "actionUrl": "https://app.example.com/features/new",
  "channels": ["PUSH", "IN_APP"],
  "scheduledFor": "2024-02-01T10:00:00Z"
}
```

**Recipient Types:**
- `USER` - Single user (provide `recipientIds`)
- `USERS` - Multiple users (provide `recipientIds` array)
- `ALL` - All active users
- `SEGMENT` - User segment (provide `segment` name)

**Channels:**
- `PUSH` - Push notification
- `IN_APP` - In-app notification
- `EMAIL` - Email notification

**Available Segments:**
- `PREMIUM_USERS` - Users with active premium subscriptions
- `INACTIVE_30_DAYS` - Users inactive for 30+ days
- `HIGH_ENGAGEMENT` - Highly engaged users

---

## Health Check

```
GET /api/admin/health
```

**Response:**
```json
{
  "ok": true,
  "scope": "admin"
}
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication token is missing or invalid |
| `ADMIN_REQUIRED` | 403 | Only administrators can access this resource |
| `USER_NOT_FOUND` | 404 | User does not exist |
| `UPLOAD_NOT_FOUND` | 404 | Upload does not exist |
| `SONG_NOT_FOUND` | 404 | Song does not exist |
| `PROMO_CODE_NOT_FOUND` | 404 | Promo code does not exist |
| `PLAN_NOT_FOUND` | 404 | Plan does not exist |
| `USER_ALREADY_SUSPENDED` | 400 | User is already suspended |
| `USER_NOT_BLOCKED` | 400 | Song is not blocked |
| `PROMO_CODE_EXISTS` | 409 | Promo code already exists |
| `PLAN_EXISTS` | 409 | Plan code already exists |
| `PLAN_IN_USE` | 400 | Cannot delete plan with active subscriptions |

---

## Audit Logging

All admin actions are logged with:
- Admin user ID
- Action type
- Target type and ID
- Timestamp
- IP address
- User agent

Audit logs can be used for compliance and security monitoring.

---

## Rate Limiting

Admin endpoints may be subject to rate limiting:
- Standard: 100 requests per minute per admin user
- Admin operations: 10 requests per minute per action type

---

## Examples

### Suspend a User for 30 Days
```bash
curl -X POST https://api.example.com/api/admin/users/{userId}/suspend \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Multiple copyright violations",
    "duration": 30
  }'
```

### Create a Promotional Discount
```bash
curl -X POST https://api.example.com/api/admin/promo-codes \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "HOLIDAY25",
    "description": "Holiday special - 25% off",
    "discountType": "PERCENT",
    "discountValue": 25,
    "maxRedemptions": 5000,
    "expiresAt": "2024-12-25T23:59:59Z"
  }'
```

### Get Dashboard Statistics
```bash
curl -X GET 'https://api.example.com/api/admin/analytics/dashboard?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z' \
  -H "Authorization: Bearer {token}"
```

---

## Implementation Notes

1. **Database Transactions**: Use transactions for operations that modify multiple related records
2. **Validation**: All input is validated using Zod schemas
3. **Error Handling**: Errors include appropriate HTTP status codes and error codes
4. **Pagination**: Large result sets use cursor-based or offset-based pagination
5. **Soft Deletes**: User deletion supports anonymization (soft delete) for compliance
6. **Audit Trail**: All modifications are logged for compliance and debugging

---

## Future Enhancements

1. Advanced reporting and analytics dashboard
2. Bulk operations (e.g., bulk user suspension)
3. Scheduled notifications and campaigns
4. Custom user segments
5. Content recommendation tools
6. Revenue analytics and forecasting
7. A/B testing framework
8. Admin role-based access control (RBAC) with granular permissions
