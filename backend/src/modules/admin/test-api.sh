#!/bin/bash

# Music App Admin API - cURL Test Examples
# This script contains examples for testing all admin endpoints
# Set these environment variables before running:
# - API_BASE_URL: Base API URL (e.g., http://localhost:3000/api)
# - ADMIN_TOKEN: Valid admin bearer token
# - API_ADMIN_TOKEN: Bearer token for admin user

# Set defaults if not provided
API_BASE_URL="${API_BASE_URL:-http://localhost:3000/api}"
ADMIN_TOKEN="${ADMIN_TOKEN:-your-admin-token-here}"

# Helper function to make authenticated requests
function admin_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  
  if [ -z "$data" ]; then
    curl -X "$method" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      "$API_BASE_URL$endpoint"
  else
    curl -X "$method" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$API_BASE_URL$endpoint"
  fi
}

echo "=========================================="
echo "Music App Admin API - Test Suite"
echo "=========================================="
echo "API Base URL: $API_BASE_URL"
echo ""

# ==================== HEALTH CHECK ====================
echo "[1] Health Check"
echo "GET /admin/health"
admin_request GET "/admin/health"
echo -e "\n\n"

# ==================== USER MANAGEMENT ====================
echo "[2] Get All Users"
echo "GET /admin/users?page=1&limit=20"
admin_request GET "/admin/users?page=1&limit=20"
echo -e "\n\n"

echo "[3] Search Users"
echo "GET /admin/users?search=john&limit=10"
admin_request GET "/admin/users?search=john&limit=10"
echo -e "\n\n"

# Note: Replace {USER_ID} with actual user UUID
USER_ID="550e8400-e29b-41d4-a716-446655440000"

echo "[4] Get User Details"
echo "GET /admin/users/$USER_ID"
admin_request GET "/admin/users/$USER_ID"
echo -e "\n\n"

echo "[5] Suspend User"
echo "POST /admin/users/$USER_ID/suspend"
admin_request POST "/admin/users/$USER_ID/suspend" '{
  "reason": "Violation of terms of service - multiple copyright strikes",
  "duration": 30
}'
echo -e "\n\n"

echo "[6] Activate User"
echo "POST /admin/users/$USER_ID/activate"
admin_request POST "/admin/users/$USER_ID/activate" '{
  "reason": "Suspension period completed"
}'
echo -e "\n\n"

echo "[7] Update User Role to Admin"
echo "PATCH /admin/users/$USER_ID/role"
admin_request PATCH "/admin/users/$USER_ID/role" '{
  "role": "ADMIN"
}'
echo -e "\n\n"

echo "[8] Delete User (Anonymize)"
echo "DELETE /admin/users/$USER_ID"
admin_request DELETE "/admin/users/$USER_ID" '{
  "reason": "User requested account deletion",
  "anonymize": true
}'
echo -e "\n\n"

# ==================== CONTENT MODERATION ====================
echo "[9] Get Uploads for Review"
echo "GET /admin/moderation/uploads?page=1&limit=20"
admin_request GET "/admin/moderation/uploads?page=1&limit=20"
echo -e "\n\n"

# Note: Replace {UPLOAD_ID} with actual upload UUID
UPLOAD_ID="550e8400-e29b-41d4-a716-446655440001"
SONG_ID="550e8400-e29b-41d4-a716-446655440002"

echo "[10] Review Upload (Approve)"
echo "POST /admin/moderation/uploads/$UPLOAD_ID/review"
admin_request POST "/admin/moderation/uploads/$UPLOAD_ID/review" '{
  "status": "APPROVED",
  "moderationNotes": "Content verified and approved",
  "actionItems": ["Add proper metadata", "Verify artist name"]
}'
echo -e "\n\n"

echo "[11] Review Upload (Reject)"
echo "POST /admin/moderation/uploads/$UPLOAD_ID/review"
admin_request POST "/admin/moderation/uploads/$UPLOAD_ID/review" '{
  "status": "REJECTED",
  "moderationNotes": "Poor audio quality, re-encode required",
  "actionItems": ["Re-encode at higher bitrate"]
}'
echo -e "\n\n"

echo "[12] Block Song"
echo "POST /admin/moderation/songs/$SONG_ID/block"
admin_request POST "/admin/moderation/songs/$SONG_ID/block" '{
  "reason": "COPYRIGHTED",
  "details": "Song contains copyrighted material owned by Sony Music",
  "permanent": true,
  "notifyUploader": true
}'
echo -e "\n\n"

echo "[13] Unblock Song"
echo "POST /admin/moderation/songs/$SONG_ID/unblock"
admin_request POST "/admin/moderation/songs/$SONG_ID/unblock" '{
  "reason": "Appeal approved - artist confirmed they hold rights"
}'
echo -e "\n\n"

# ==================== PROMO CODE MANAGEMENT ====================
echo "[14] Get All Promo Codes"
echo "GET /admin/promo-codes?page=1&limit=20"
admin_request GET "/admin/promo-codes?page=1&limit=20"
echo -e "\n\n"

echo "[15] Get Active Promo Codes Only"
echo "GET /admin/promo-codes?isActive=true"
admin_request GET "/admin/promo-codes?isActive=true"
echo -e "\n\n"

echo "[16] Create Promo Code (Percentage Discount)"
echo "POST /admin/promo-codes"
admin_request POST "/admin/promo-codes" '{
  "code": "SUMMER2024",
  "description": "Summer promotional offer - 25% off all plans",
  "discountType": "PERCENT",
  "discountValue": 25,
  "maxRedemptions": 1000,
  "startsAt": "2024-06-01T00:00:00Z",
  "expiresAt": "2024-08-31T23:59:59Z"
}'
echo -e "\n\n"

echo "[17] Create Promo Code (Fixed Discount)"
echo "POST /admin/promo-codes"
admin_request POST "/admin/promo-codes" '{
  "code": "WELCOME10",
  "description": "Welcome offer - $10 off first subscription",
  "discountType": "FIXED",
  "discountValue": 10.00,
  "maxRedemptions": 5000,
  "expiresAt": "2024-12-31T23:59:59Z"
}'
echo -e "\n\n"

# Note: Replace {CODE_ID} with actual promo code UUID
CODE_ID="550e8400-e29b-41d4-a716-446655440003"

echo "[18] Update Promo Code"
echo "PATCH /admin/promo-codes/$CODE_ID"
admin_request PATCH "/admin/promo-codes/$CODE_ID" '{
  "isActive": false,
  "maxRedemptions": 2000,
  "expiresAt": "2024-07-31T23:59:59Z"
}'
echo -e "\n\n"

echo "[19] Delete Promo Code"
echo "DELETE /admin/promo-codes/$CODE_ID"
admin_request DELETE "/admin/promo-codes/$CODE_ID"
echo -e "\n\n"

# ==================== PLAN MANAGEMENT ====================
echo "[20] Get All Plans"
echo "GET /admin/plans"
admin_request GET "/admin/plans"
echo -e "\n\n"

echo "[21] Get Active Plans Only"
echo "GET /admin/plans?isActive=true"
admin_request GET "/admin/plans?isActive=true"
echo -e "\n\n"

echo "[22] Create Monthly Plan"
echo "POST /admin/plans"
admin_request POST "/admin/plans" '{
  "code": "PREMIUM_MONTHLY",
  "name": "Premium Monthly",
  "description": "Full access to premium features - billed monthly",
  "interval": "MONTHLY",
  "priceCents": 999,
  "currency": "USD",
  "isActive": true
}'
echo -e "\n\n"

echo "[23] Create Yearly Plan"
echo "POST /admin/plans"
admin_request POST "/admin/plans" '{
  "code": "PREMIUM_YEARLY",
  "name": "Premium Yearly",
  "description": "Discounted yearly subscription - save 17%",
  "interval": "YEARLY",
  "priceCents": 9999,
  "currency": "USD",
  "isActive": true
}'
echo -e "\n\n"

# Note: Replace {PLAN_ID} with actual plan UUID
PLAN_ID="550e8400-e29b-41d4-a716-446655440004"

echo "[24] Update Plan"
echo "PATCH /admin/plans/$PLAN_ID"
admin_request PATCH "/admin/plans/$PLAN_ID" '{
  "name": "Premium Yearly Pro",
  "priceCents": 11999,
  "isActive": true
}'
echo -e "\n\n"

echo "[25] Delete Plan"
echo "DELETE /admin/plans/$PLAN_ID"
admin_request DELETE "/admin/plans/$PLAN_ID"
echo -e "\n\n"

# ==================== ANALYTICS ====================
echo "[26] Get Dashboard Statistics"
echo "GET /admin/analytics/dashboard?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z"
admin_request GET "/admin/analytics/dashboard?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z"
echo -e "\n\n"

echo "[27] Get Daily User Growth"
echo "GET /admin/analytics/user-growth?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z&breakdown=DAILY"
admin_request GET "/admin/analytics/user-growth?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z&breakdown=DAILY"
echo -e "\n\n"

echo "[28] Get Weekly User Growth"
echo "GET /admin/analytics/user-growth?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z&breakdown=WEEKLY"
admin_request GET "/admin/analytics/user-growth?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z&breakdown=WEEKLY"
echo -e "\n\n"

# ==================== NOTIFICATIONS ====================
echo "[29] Send Notification to Single User"
echo "POST /admin/notifications/send"
admin_request POST "/admin/notifications/send" '{
  "recipientType": "USER",
  "recipientIds": ["550e8400-e29b-41d4-a716-446655440005"],
  "title": "Your subscription is expiring",
  "message": "Your premium subscription expires in 7 days. Renew to continue enjoying unlimited access.",
  "actionUrl": "https://app.example.com/subscription",
  "channels": ["PUSH", "IN_APP"]
}'
echo -e "\n\n"

echo "[30] Send Notification to All Users"
echo "POST /admin/notifications/send"
admin_request POST "/admin/notifications/send" '{
  "recipientType": "ALL",
  "title": "New Feature Released",
  "message": "Check out our new offline listening feature!",
  "actionUrl": "https://app.example.com/features/offline",
  "channels": ["PUSH", "IN_APP", "EMAIL"]
}'
echo -e "\n\n"

echo "[31] Send Notification to Premium Users Segment"
echo "POST /admin/notifications/send"
admin_request POST "/admin/notifications/send" '{
  "recipientType": "SEGMENT",
  "segment": "PREMIUM_USERS",
  "title": "Premium Exclusive: New Release Early Access",
  "message": "Listen to the latest releases 24 hours before other users",
  "channels": ["PUSH"]
}'
echo -e "\n\n"

echo "[32] Send Scheduled Notification"
echo "POST /admin/notifications/send"
admin_request POST "/admin/notifications/send" '{
  "recipientType": "SEGMENT",
  "segment": "INACTIVE_30_DAYS",
  "title": "We miss you!",
  "message": "Come back and discover what you have been missing",
  "channels": ["EMAIL"],
  "scheduledFor": "2024-02-01T10:00:00Z"
}'
echo -e "\n\n"

echo "=========================================="
echo "Test suite completed!"
echo "=========================================="
