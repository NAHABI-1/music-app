const { z } = require('zod');

const { validateBody } = require('../../middleware/validateBody');

function validateQuery(schema) {
  return (request, _response, next) => {
    const parsed = schema.safeParse(request.query || {});
    if (!parsed.success) {
      return next({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid query parameters.',
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    request.validatedQuery = parsed.data;
    return next();
  };
}

function validateParams(schema) {
  return (request, _response, next) => {
    const parsed = schema.safeParse(request.params || {});
    if (!parsed.success) {
      return next({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid route parameters.',
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    request.validatedParams = parsed.data;
    return next();
  };
}

const jsonRecordSchema = z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]));

const notificationIdParamsSchema = z.object({
  notificationId: z.string().uuid(),
});

const listNotificationsQuerySchema = z.object({
  channel: z.enum(['IN_APP', 'PUSH', 'EMAIL', 'SYSTEM']).optional(),
  status: z.enum(['QUEUED', 'SENT', 'FAILED', 'READ', 'DISMISSED']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  includeDismissed: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((value) => value === true || value === 'true'),
});

const updateNotificationPreferencesSchema = z
  .object({
    inAppNotificationsEnabled: z.boolean().optional(),
    pushNotificationsEnabled: z.boolean().optional(),
    emailNotificationsEnabled: z.boolean().optional(),
    emailMarketingEnabled: z.boolean().optional(),
    emailProductUpdatesEnabled: z.boolean().optional(),
    emailSecurityAlertsEnabled: z.boolean().optional(),
    notificationTopics: jsonRecordSchema.optional().nullable(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one preference field must be provided.',
  });

const pushScaffoldSchema = z.object({
  title: z.string().min(1).max(220),
  body: z.string().min(1).max(4000),
  metadata: jsonRecordSchema.optional(),
});

const deliveryAudienceSchema = z.enum(['ALL', 'FREE', 'PREMIUM']);

const announcementDeliverySchema = z.object({
  title: z.string().min(1).max(220),
  body: z.string().min(1).max(4000),
  audience: deliveryAudienceSchema.default('ALL'),
  scheduleAt: z.string().datetime().optional(),
  metadata: jsonRecordSchema.optional(),
});

const marketingOfferSchema = z.object({
  title: z.string().min(1).max(220),
  body: z.string().min(1).max(4000),
  audience: deliveryAudienceSchema.default('ALL'),
  premiumOnly: z.boolean().default(false),
  metadata: jsonRecordSchema.optional(),
});

module.exports = {
  validateBody,
  validateQuery,
  validateParams,
  notificationIdParamsSchema,
  listNotificationsQuerySchema,
  updateNotificationPreferencesSchema,
  pushScaffoldSchema,
  announcementDeliverySchema,
  marketingOfferSchema,
};