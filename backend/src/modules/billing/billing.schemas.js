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

const planCodeSchema = z.string().trim().min(1).max(80);

const promoCodeBodySchema = z.object({
  code: z.string().trim().min(1).max(64),
});

const checkoutSessionSchema = z.object({
  planCode: planCodeSchema,
  promoCode: z.string().trim().min(1).max(64).optional(),
  billingCycle: z.enum(['MONTHLY', 'YEARLY', 'LIFETIME']).optional(),
});

const promoCodeParamsSchema = z.object({
  code: z.string().trim().min(1).max(64),
});

const webhookParamsSchema = z.object({
  provider: z.string().trim().min(1).max(80),
});

const webhookEventSchema = z
  .object({
    eventType: z.string().trim().min(1).max(120),
    providerRef: z.string().trim().min(1).max(140).optional(),
    paymentId: z.string().uuid().optional(),
    subscriptionId: z.string().uuid().optional(),
    status: z.enum(['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CHARGEBACK']).optional(),
    data: z.record(z.any()).optional(),
  })
  .passthrough();

const planQuerySchema = z.object({
  includeInactive: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((value) => value === true || value === 'true'),
});

module.exports = {
  validateBody,
  validateParams,
  validateQuery,
  planCodeSchema,
  promoCodeBodySchema,
  checkoutSessionSchema,
  promoCodeParamsSchema,
  webhookParamsSchema,
  webhookEventSchema,
  planQuerySchema,
};