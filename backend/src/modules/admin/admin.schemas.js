const { z } = require('zod');
const { validateBody } = require('../../middleware/validateBody');

// Pagination schema
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  sort: z.enum(['asc', 'desc']).default('desc'),
  sortBy: z.string().max(50).optional(),
});

// User management schemas
const suspendUserSchema = z.object({
  reason: z.string().min(1).max(500),
  duration: z.number().int().positive().optional(), // in days
});

const activateUserSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
});

const deleteUserSchema = z.object({
  reason: z.string().min(1).max(500),
  anonymize: z.boolean().default(true),
});

const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
});

// Content moderation schemas
const reviewUploadSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  moderationNotes: z.string().min(1).max(1000),
  actionItems: z.array(z.string().max(200)).optional(),
});

const blockSongSchema = z.object({
  reason: z.enum(['COPYRIGHTED', 'EXPLICIT', 'OFFENSIVE', 'LOW_QUALITY', 'OTHER']),
  details: z.string().min(1).max(1000),
  permanent: z.boolean().default(false),
  notifyUploader: z.boolean().default(true),
});

const unblockSongSchema = z.object({
  reason: z.string().min(1).max(500),
});

// Promo code management schemas
const createPromoCodeSchema = z.object({
  code: z.string().min(3).max(64).transform((v) => v.trim().toUpperCase()),
  description: z.string().max(500).optional(),
  discountType: z.enum(['PERCENT', 'FIXED']),
  discountValue: z.number().positive(),
  maxRedemptions: z.number().int().positive().optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime(),
}).superRefine((value, context) => {
  if (value.discountType === 'PERCENT' && value.discountValue > 100) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'discountValue must be at most 100 for PERCENT discounts',
      path: ['discountValue'],
    });
  }
});

const updatePromoCodeSchema = z.object({
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  maxRedemptions: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
});

// Plan management schemas
const createPlanSchema = z.object({
  code: z.string().min(2).max(80),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  interval: z.enum(['MONTHLY', 'YEARLY', 'LIFETIME']),
  priceCents: z.number().int().positive(),
  currency: z.string().length(3).default('USD'),
  isActive: z.boolean().default(true),
});

const updatePlanSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  priceCents: z.number().int().positive().optional(),
  currency: z.string().length(3).optional(),
  isActive: z.boolean().optional(),
});

// Analytics and reporting schemas
const analyticsFilterSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  metric: z
    .enum([
      'TOTAL_USERS',
      'ACTIVE_USERS',
      'TOTAL_PLAYS',
      'TOTAL_REVENUE',
      'TOTAL_SUBSCRIPTIONS',
      'SIGNUP_COUNT',
      'CHURN_RATE',
    ])
    .optional(),
  breakdown: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).default('DAILY'),
});

// Notification schemas
const sendNotificationSchema = z.object({
  recipientType: z.enum(['USER', 'USERS', 'ALL', 'SEGMENT']),
  recipientIds: z.array(z.string().uuid()).optional(),
  segment: z.string().max(100).optional(), // e.g., 'PREMIUM_USERS', 'INACTIVE_30_DAYS'
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  actionUrl: z.string().url().optional(),
  channels: z.array(z.enum(['IN_APP', 'PUSH', 'EMAIL'])).min(1),
  scheduledFor: z.string().datetime().optional(),
}).superRefine((value, context) => {
  if ((value.recipientType === 'USER' || value.recipientType === 'USERS') && !value.recipientIds?.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'recipientIds is required when recipientType is USER or USERS',
      path: ['recipientIds'],
    });
  }

  if (value.recipientType === 'SEGMENT' && !value.segment) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'segment is required when recipientType is SEGMENT',
      path: ['segment'],
    });
  }
});

// Audit log schemas
const auditLogFilterSchema = z.object({
  action: z.string().max(100).optional(),
  adminId: z.string().uuid().optional(),
  targetType: z.string().max(100).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

module.exports = {
  paginationSchema,
  // User management
  suspendUserSchema,
  activateUserSchema,
  deleteUserSchema,
  updateUserRoleSchema,
  // Content moderation
  reviewUploadSchema,
  blockSongSchema,
  unblockSongSchema,
  // Promo codes
  createPromoCodeSchema,
  updatePromoCodeSchema,
  // Plans
  createPlanSchema,
  updatePlanSchema,
  // Analytics
  analyticsFilterSchema,
  // Notifications
  sendNotificationSchema,
  // Audit logs
  auditLogFilterSchema,
  // Middleware
  validateBody,
};
