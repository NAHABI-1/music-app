# Admin Module Integration Guide

## Quick Start

### 1. Installation & Setup

The admin module is built into the application. No additional setup required.

### 2. Basic Requirements

To access admin endpoints:

1. **User Role**: Must be an ADMIN
   ```javascript
   // User schema includes role
   role: 'ADMIN' // Not 'USER'
   ```

2. **Valid Authentication**:
   ```
   Authorization: Bearer <valid_access_token>
   ```

3. **Active Status**:
   ```javascript
   status: 'ACTIVE' // User must be active
   ```

### 3. Getting an Admin Token

```javascript
// After login as admin user
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "secure-password",
  "deviceId": "device-123"
}

// Response includes access_token and refresh_token
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "refresh-token-string",
  "user": {
    "id": "user-uuid",
    "role": "ADMIN"
  }
}
```

## Common Patterns

### Pattern 1: List Resources with Pagination

```javascript
// Get all users with pagination
const getUsers = async (page = 1, limit = 20) => {
  const response = await fetch(`/api/admin/users?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  return data; // { data: [], pagination: { page, limit, total, pages } }
};
```

### Pattern 2: Search Resources

```javascript
// Search users by email or name
const searchUsers = async (query) => {
  const response = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&limit=10`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  
  return response.json();
};
```

### Pattern 3: Perform Admin Action

```javascript
// Suspend a user
const suspendUser = async (userId, reason, days) => {
  const response = await fetch(`/api/admin/users/${userId}/suspend`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      reason: reason,
      duration: days
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }
  
  return response.json();
};
```

### Pattern 4: Bulk Operations

```javascript
// Suspend multiple users
const suspendMultipleUsers = async (userIds, reason) => {
  const promises = userIds.map(userId =>
    suspendUser(userId, reason, 30)
  );
  
  const results = await Promise.allSettled(promises);
  
  return {
    succeeded: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
    results
  };
};
```

### Pattern 5: Filter with Multiple Criteria

```javascript
// Get uploads with filters
const getUploadsForReview = async (options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort = 'asc'
  } = options;
  
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort
  });
  
  const response = await fetch(`/api/admin/moderation/uploads?${params}`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  
  return response.json();
};
```

## Implementation Examples

### Example 1: User Management Dashboard

```javascript
class UserManagementService {
  constructor(adminToken) {
    this.adminToken = adminToken;
    this.baseUrl = '/api/admin';
  }
  
  async getUsers(filters = {}) {
    const query = new URLSearchParams(filters);
    const response = await this._request(`/users?${query}`);
    return response;
  }
  
  async getUserDetails(userId) {
    return this._request(`/users/${userId}`);
  }
  
  async suspendUser(userId, reason) {
    return this._request(`/users/${userId}/suspend`, 'POST', { reason });
  }
  
  async activateUser(userId) {
    return this._request(`/users/${userId}/activate`, 'POST', {});
  }
  
  async changeUserRole(userId, role) {
    return this._request(`/users/${userId}/role`, 'PATCH', { role });
  }
  
  async deleteUser(userId, reason) {
    return this._request(`/users/${userId}`, 'DELETE', {
      reason,
      anonymize: true
    });
  }
  
  async _request(endpoint, method = 'GET', body = null) {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.adminToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }
    
    return response.json();
  }
}

// Usage
const userService = new UserManagementService(adminToken);
const users = await userService.getUsers({ search: 'john', limit: 10 });
```

### Example 2: Content Moderation Workflow

```javascript
class ModerationService {
  constructor(adminToken) {
    this.adminToken = adminToken;
  }
  
  async getUploadsForReview(page = 1) {
    // Get pending uploads
    const response = await fetch(
      `/api/admin/moderation/uploads?page=${page}&limit=10`,
      { headers: { 'Authorization': `Bearer ${this.adminToken}` } }
    );
    return response.json();
  }
  
  async approveUpload(uploadId, notes) {
    return this._reviewUpload(uploadId, 'APPROVED', notes);
  }
  
  async rejectUpload(uploadId, notes) {
    return this._reviewUpload(uploadId, 'REJECTED', notes);
  }
  
  async blockSong(songId, reason) {
    const response = await fetch(
      `/api/admin/moderation/songs/${songId}/block`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: reason,
          details: `Blocked by admin`,
          permanent: true,
          notifyUploader: true
        })
      }
    );
    return response.json();
  }
  
  async _reviewUpload(uploadId, status, notes) {
    const response = await fetch(
      `/api/admin/moderation/uploads/${uploadId}/review`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: status,
          moderationNotes: notes
        })
      }
    );
    return response.json();
  }
}
```

### Example 3: Promotional Campaign Management

```javascript
class CampaignService {
  constructor(adminToken) {
    this.adminToken = adminToken;
  }
  
  async createPromotion(code, discount) {
    const response = await fetch('/api/admin/promo-codes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: code.toUpperCase(),
        description: discount.description,
        discountType: discount.type, // PERCENT or FIXED
        discountValue: discount.value,
        maxRedemptions: discount.maxUses,
        startsAt: discount.startDate,
        expiresAt: discount.endDate
      })
    });
    
    if (!response.ok) throw new Error('Failed to create promo');
    return response.json();
  }
  
  async getActivePromotions() {
    const response = await fetch(
      '/api/admin/promo-codes?isActive=true',
      { headers: { 'Authorization': `Bearer ${this.adminToken}` } }
    );
    return response.json();
  }
  
  async disablePromotion(promoId, reason) {
    const response = await fetch(
      `/api/admin/promo-codes/${promoId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: false })
      }
    );
    return response.json();
  }
}
```

### Example 4: Analytics Dashboard

```javascript
class AnalyticsService {
  constructor(adminToken) {
    this.adminToken = adminToken;
  }
  
  async getDashboardStats(startDate, endDate) {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    const response = await fetch(
      `/api/admin/analytics/dashboard?${params}`,
      { headers: { 'Authorization': `Bearer ${this.adminToken}` } }
    );
    
    return response.json();
  }
  
  async getUserGrowthMetrics(startDate, endDate, breakdown = 'DAILY') {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      breakdown
    });
    
    const response = await fetch(
      `/api/admin/analytics/user-growth?${params}`,
      { headers: { 'Authorization': `Bearer ${this.adminToken}` } }
    );
    
    return response.json();
  }
  
  async getMonthlyReport(month, year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    
    const stats = await this.getDashboardStats(start, end);
    const growth = await this.getUserGrowthMetrics(start, end, 'DAILY');
    
    return { stats, growth };
  }
}
```

### Example 5: Notification Broadcasting

```javascript
class NotificationService {
  constructor(adminToken) {
    this.adminToken = adminToken;
  }
  
  async sendToAll(title, message, actionUrl = null) {
    return this._send({
      recipientType: 'ALL',
      title,
      message,
      actionUrl,
      channels: ['PUSH', 'IN_APP']
    });
  }
  
  async sendToSegment(segment, title, message) {
    return this._send({
      recipientType: 'SEGMENT',
      segment,
      title,
      message,
      channels: ['PUSH']
    });
  }
  
  async sendToUsers(userIds, title, message) {
    return this._send({
      recipientType: 'USERS',
      recipientIds: userIds,
      title,
      message,
      channels: ['PUSH', 'IN_APP']
    });
  }
  
  async scheduleNotification(recipientType, title, message, scheduledFor) {
    return this._send({
      recipientType,
      title,
      message,
      channels: ['EMAIL'],
      scheduledFor: scheduledFor.toISOString()
    });
  }
  
  async _send(params) {
    const response = await fetch('/api/admin/notifications/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) throw new Error('Failed to send notification');
    return response.json();
  }
}
```

## Error Handling

All admin endpoints return consistent error responses:

```javascript
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "statusCode": 400,
    "details": { /* additional context */ }
  }
}
```

### Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `AUTH_REQUIRED` | 401 | Missing or invalid token |
| `ADMIN_REQUIRED` | 403 | User is not an admin |
| `USER_NOT_FOUND` | 404 | User doesn't exist |
| `PLAN_IN_USE` | 400 | Cannot delete active plan |
| `PROMO_CODE_EXISTS` | 409 | Promo code already used |

### Error Handling Pattern

```javascript
async function safeAdminAction(action) {
  try {
    return await action();
  } catch (error) {
    if (error.response?.status === 401) {
      // Refresh token or redirect to login
    } else if (error.response?.status === 403) {
      // User not admin
      throw new Error('Admin access required');
    } else if (error.response?.status === 404) {
      // Resource not found
      throw new Error('Resource not found');
    } else {
      // Generic error
      throw error;
    }
  }
}
```

## Performance Considerations

- **Pagination**: Use pagination for large result sets
- **Filtering**: Filter on server side rather than client side
- **Batch Operations**: Use Promise.allSettled for bulk operations
- **Caching**: Cache frequently accessed data (plans, stats)

## Security Best Practices

1. **Token Management**:
   - Refresh tokens regularly
   - Store tokens securely (never in localStorage for sensitive apps)
   - Clear tokens on logout

2. **Request Validation**:
   - Validate all input before sending
   - Check for authorization on sensitive operations
   - Use HTTPS only

3. **Audit Trail**:
   - All admin actions are logged
   - Monitor audit log for suspicious activity
   - Review access patterns regularly

4. **Rate Limiting**:
   - Be aware of rate limits: 100 req/min per admin
   - Implement exponential backoff for retries

## Testing

### Unit Test Example

```javascript
describe('UserManagementService', () => {
  let service;
  
  beforeEach(() => {
    service = new UserManagementService('test-token');
  });
  
  test('should get users with pagination', async () => {
    const result = await service.getUsers({ page: 1, limit: 10 });
    expect(result.pagination.page).toBe(1);
    expect(result.data).toBeArray();
  });
  
  test('should suspend user', async () => {
    const result = await service.suspendUser('user-id', 'Test reason');
    expect(result.user.status).toBe('SUSPENDED');
  });
});
```

## Debugging

Enable debug logging:

```javascript
class DebugService {
  static enable() {
    localStorage.setItem('DEBUG_ADMIN_API', 'true');
  }
  
  static log(message, data) {
    if (localStorage.getItem('DEBUG_ADMIN_API')) {
      console.log(`[ADMIN API] ${message}`, data);
    }
  }
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check token validity and expiry |
| 403 Forbidden | Verify user has ADMIN role |
| 404 Not Found | Verify resource ID is correct |
| 409 Conflict | Resource already exists (promo code, etc) |
| 5xx Server Error | Check server logs |

## Additional Resources

- [API Documentation](./README.md)
- [Type Definitions](./admin.types.ts)
- [cURL Examples](./test-api.sh)
