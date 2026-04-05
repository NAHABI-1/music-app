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

const campaignIdParamsSchema = z.object({
  campaignId: z.string().uuid(),
});

const campaignStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']);

const campaignQuerySchema = z.object({
  status: campaignStatusSchema.optional(),
});

const feedQuerySchema = z.object({
  placement: z.enum(['HOME', 'LIBRARY', 'PLAYER', 'DOWNLOADS']).optional(),
});

const createCampaignSchema = z.object({
  name: z.string().trim().min(1).max(180),
  status: campaignStatusSchema.default('DRAFT'),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  budgetCents: z.number().int().min(0).optional(),
  impressionsTarget: z.number().int().min(0).optional(),
  clicksTarget: z.number().int().min(0).optional(),
  metadata: z.record(z.any()).optional(),
});

const adInteractionSchema = z.object({
  interactionType: z.enum(['IMPRESSION', 'CLICK']),
  campaignId: z.string().uuid().optional().nullable(),
  placement: z.enum(['HOME', 'LIBRARY', 'PLAYER', 'DOWNLOADS', 'UNKNOWN']).default('UNKNOWN'),
  creativeType: z.enum(['BANNER', 'INTERSTITIAL', 'REWARDED', 'PROMO']).default('BANNER'),
  metadata: z.record(z.any()).optional(),
});

const updateCampaignSchema = z
  .object({
    name: z.string().trim().min(1).max(180).optional(),
    status: campaignStatusSchema.optional(),
    startsAt: z.string().datetime().nullable().optional(),
    endsAt: z.string().datetime().nullable().optional(),
    budgetCents: z.number().int().min(0).nullable().optional(),
    impressionsTarget: z.number().int().min(0).nullable().optional(),
    clicksTarget: z.number().int().min(0).nullable().optional(),
    metadata: z.record(z.any()).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided for updates.',
  });

module.exports = {
  validateBody,
  validateQuery,
  validateParams,
  campaignIdParamsSchema,
  campaignQuerySchema,
  feedQuerySchema,
  adInteractionSchema,
  createCampaignSchema,
  updateCampaignSchema,
};