const { z } = require('zod');

const { validateBody } = require('../../middleware/validateBody');
const { TRACKED_ANALYTICS_EVENT_NAMES, isRetentionEventName } = require('../../services/analytics.catalog');

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

const analyticsSourceSchema = z.enum(['MOBILE', 'BACKEND', 'ADMIN']);

function withTimeWindowValidation(schema) {
  return schema.refine((value) => !(value.from && value.to) || new Date(value.from) <= new Date(value.to), {
    message: 'Query parameter from must be before or equal to to.',
    path: ['from'],
  });
}

const analyticsEventNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(140)
  .refine((name) => TRACKED_ANALYTICS_EVENT_NAMES.includes(name) || isRetentionEventName(name), {
    message: 'Unsupported analytics event name.',
  });

const analyticsPropertiesSchema = z.record(z.any()).optional();

const ingestionEventSchema = z.object({
  eventName: analyticsEventNameSchema,
  source: analyticsSourceSchema.default('MOBILE'),
  deviceSessionId: z.string().uuid().optional().nullable(),
  properties: analyticsPropertiesSchema,
  eventTimestamp: z.string().datetime().optional(),
});

const ingestBatchSchema = z.object({
  events: z.array(ingestionEventSchema).min(1).max(100),
});

const summaryQueryBaseSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

const summaryQuerySchema = withTimeWindowValidation(summaryQueryBaseSchema);

const adminOverviewQuerySchema = withTimeWindowValidation(
  summaryQueryBaseSchema.extend({
    source: analyticsSourceSchema.optional(),
  })
);

const adminEventsQuerySchema = withTimeWindowValidation(
  summaryQueryBaseSchema.extend({
    source: analyticsSourceSchema.optional(),
    category: z
      .enum([
        'uploads',
        'playback',
        'downloads',
        'favorites',
        'playlist_actions',
        'premium_conversions',
        'ad_engagement',
        'retention',
      ])
      .optional(),
    eventName: analyticsEventNameSchema.optional(),
    userId: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).max(5000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(50),
  })
);

module.exports = {
  validateBody,
  validateQuery,
  analyticsSourceSchema,
  ingestionEventSchema,
  ingestBatchSchema,
  summaryQuerySchema,
  adminOverviewQuerySchema,
  adminEventsQuerySchema,
};