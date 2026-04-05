/**
 * Admin Module Type Definitions
 * Generated types for better TypeScript support and IDE autocomplete
 */

// ==================== USER MANAGEMENT ====================

interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  profile?: AdminUserProfile;
}

interface AdminUserProfile {
  displayName: string;
  avatarUrl?: string;
  bio?: string;
}

interface AdminUserListResponse {
  data: AdminUser[];
  pagination: PaginationMeta;
}

interface AdminUserDetailsResponse extends AdminUser {
  _count: {
    songsUploaded: number;
    playlists: number;
    favorites: number;
    recentPlays: number;
  };
  subscriptions: AdminSubscription[];
  uploads: AdminUpload[];
}

interface AdminSubscription {
  id: string;
  status: SubscriptionStatus;
  plan: PlanInfo;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}

interface PlanInfo {
  id: string;
  name: string;
  interval: PlanInterval;
}

interface AdminUpload {
  id: string;
  status: UploadStatus;
  songs: number;
  uploadedAt: Date;
}

// ==================== USER ACTIONS ====================

interface SuspendUserRequest {
  reason: string;
  duration?: number; // in days
}

interface SuspendUserResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    status: UserStatus;
  };
  reason: string;
}

interface ActivateUserRequest {
  reason?: string;
}

interface ActivateUserResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    status: UserStatus;
  };
}

interface DeleteUserRequest {
  reason: string;
  anonymize: boolean;
}

interface DeleteUserResponse {
  success: boolean;
  userId: string;
  anonymized: boolean;
}

interface UpdateUserRoleRequest {
  role: "USER" | "ADMIN";
}

interface UpdateUserRoleResponse {
  id: string;
  email: string;
  role: UserRole;
}

// ==================== CONTENT MODERATION ====================

interface AdminUploadForReview {
  id: string;
  userId: string;
  status: UploadStatus;
  createdAt: Date;
  songs: AdminSongInfo[];
  user: {
    email: string;
    profile: AdminUserProfile;
  };
}

interface AdminUploadListResponse {
  data: AdminUploadForReview[];
  pagination: PaginationMeta;
}

interface ReviewUploadRequest {
  status: "APPROVED" | "REJECTED";
  moderationNotes: string;
  actionItems?: string[];
}

interface BlockSongRequest {
  reason: "COPYRIGHTED" | "EXPLICIT" | "OFFENSIVE" | "LOW_QUALITY" | "OTHER";
  details: string;
  permanent: boolean;
  notifyUploader: boolean;
}

interface BlockSongResponse {
  id: string;
  status: SongStatus;
  metadata: {
    blockReason: string;
    blockDate: string;
    blockDetails: string;
    permanent: boolean;
  };
}

interface UnblockSongRequest {
  reason: string;
}

interface UnblockSongResponse {
  id: string;
  status: SongStatus;
  metadata: {
    unblockReason: string;
    unblockDate: string;
  };
}

interface AdminSongInfo {
  id: string;
  title: string;
  artistName: string;
  status: SongStatus;
}

// ==================== PROMO CODE MANAGEMENT ====================

interface AdminPromoCode {
  id: string;
  code: string;
  description?: string;
  discountType: PromoDiscountType;
  discountValue: number;
  maxRedemptions?: number;
  redeemedCount: number;
  startsAt?: Date;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
  createdBy?: {
    email: string;
  };
}

interface AdminPromoCodeListResponse {
  data: AdminPromoCode[];
  pagination: PaginationMeta;
}

interface CreatePromoCodeRequest {
  code: string;
  description?: string;
  discountType: PromoDiscountType;
  discountValue: number;
  maxRedemptions?: number;
  startsAt?: string; // ISO 8601
  expiresAt: string; // ISO 8601
}

interface UpdatePromoCodeRequest {
  description?: string;
  isActive?: boolean;
  maxRedemptions?: number;
  expiresAt?: string; // ISO 8601
}

// ==================== PLAN MANAGEMENT ====================

interface AdminPlan {
  id: string;
  code: string;
  name: string;
  description?: string;
  interval: PlanInterval;
  priceCents: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  _count: {
    subscriptions: number;
  };
}

interface AdminPlanListResponse extends Array<AdminPlan> {}

interface CreatePlanRequest {
  code: string;
  name: string;
  description?: string;
  interval: PlanInterval;
  priceCents: number;
  currency?: string;
  isActive?: boolean;
}

interface UpdatePlanRequest {
  name?: string;
  description?: string;
  priceCents?: number;
  currency?: string;
  isActive?: boolean;
}

interface DeletePlanResponse {
  success: boolean;
  planId: string;
}

// ==================== ANALYTICS ====================

interface DashboardStatsResponse {
  totalUsers: number;
  activeUsers: number; // percentage
  totalPlays: number;
  totalRevenue: number; // in cents
  totalSubscriptions: number;
  periodStart: Date;
  periodEnd: Date;
}

interface UserGrowthMetric {
  period: string; // YYYY-MM-DD or YYYY-WXX or YYYY-MM
  signups: number;
  total: number;
}

interface UserGrowthMetricsResponse extends Array<UserGrowthMetric> {}

// ==================== NOTIFICATIONS ====================

interface SendNotificationRequest {
  recipientType: "USER" | "USERS" | "ALL" | "SEGMENT";
  recipientIds?: string[]; // for USER or USERS type
  segment?: string; // for SEGMENT type
  title: string;
  message: string;
  actionUrl?: string;
  channels: NotificationChannel[];
  scheduledFor?: string; // ISO 8601
}

interface SendNotificationResponse {
  success: boolean;
  notificationsSent: number;
  recipientCount: number;
}

// ==================== PAGINATION ====================

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ==================== ERROR HANDLING ====================

interface AdminErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: Record<string, any>;
  };
}

// ==================== ENUMS ====================

type UserRole = "USER" | "ADMIN";

type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "DELETED";

type SubscriptionStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";

type UploadStatus = "QUEUED" | "SCANNING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REJECTED";

type SongStatus = "PROCESSING" | "READY" | "BLOCKED" | "DELETED";

type PromoDiscountType = "PERCENT" | "FIXED";

type PlanInterval = "MONTHLY" | "YEARLY" | "LIFETIME";

type NotificationChannel = "IN_APP" | "PUSH" | "EMAIL" | "SYSTEM";

type UserSegment = "PREMIUM_USERS" | "INACTIVE_30_DAYS" | "HIGH_ENGAGEMENT";

// ==================== AUDIT LOGGING ====================

interface AuditLogEntry {
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, any>;
  adminId: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export {
  // User management
  AdminUser,
  AdminUserProfile,
  AdminUserListResponse,
  AdminUserDetailsResponse,
  AdminSubscription,
  PlanInfo,
  AdminUpload,
  // User actions
  SuspendUserRequest,
  SuspendUserResponse,
  ActivateUserRequest,
  ActivateUserResponse,
  DeleteUserRequest,
  DeleteUserResponse,
  UpdateUserRoleRequest,
  UpdateUserRoleResponse,
  // Content moderation
  AdminUploadForReview,
  AdminUploadListResponse,
  ReviewUploadRequest,
  BlockSongRequest,
  BlockSongResponse,
  UnblockSongRequest,
  UnblockSongResponse,
  AdminSongInfo,
  // Promo codes
  AdminPromoCode,
  AdminPromoCodeListResponse,
  CreatePromoCodeRequest,
  UpdatePromoCodeRequest,
  // Plans
  AdminPlan,
  AdminPlanListResponse,
  CreatePlanRequest,
  UpdatePlanRequest,
  DeletePlanResponse,
  // Analytics
  DashboardStatsResponse,
  UserGrowthMetric,
  UserGrowthMetricsResponse,
  // Notifications
  SendNotificationRequest,
  SendNotificationResponse,
  // Pagination
  PaginationMeta,
  // Error handling
  AdminErrorResponse,
  // Enums
  UserRole,
  UserStatus,
  SubscriptionStatus,
  UploadStatus,
  SongStatus,
  PromoDiscountType,
  PlanInterval,
  NotificationChannel,
  UserSegment,
  // Audit logging
  AuditLogEntry,
};
