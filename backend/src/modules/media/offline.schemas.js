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

const uuidSchema = z.string().uuid();

const requestOfflineAccessSchema = z.object({
  songId: uuidSchema,
  deviceSessionId: uuidSchema,
  preferredQuality: z.enum(['LOW', 'MEDIUM', 'HIGH', 'LOSSLESS']).default('MEDIUM'),
  lowDataMode: z.boolean().default(false),
});

const updateOfflineDownloadStatusSchema = z.object({
  deviceSessionId: uuidSchema,
  status: z.enum(['DOWNLOADING', 'READY', 'FAILED']),
  localPath: z.string().min(1).max(800).optional(),
  downloadProgressPct: z.number().int().min(0).max(100).optional(),
  errorReason: z.string().max(300).optional(),
}).superRefine((input, context) => {
  if (input.status === 'READY' && !input.localPath) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['localPath'],
      message: 'localPath is required when status is READY.',
    });
  }
});

const songEntitlementParamsSchema = z.object({
  songId: uuidSchema,
});

const downloadParamsSchema = z.object({
  downloadId: uuidSchema,
});

const entitlementQuerySchema = z.object({
  deviceSessionId: uuidSchema,
});

const listDownloadsQuerySchema = z.object({
  deviceSessionId: uuidSchema.optional(),
  status: z.enum(['QUEUED', 'DOWNLOADING', 'READY', 'EXPIRED', 'FAILED', 'DELETED']).optional(),
});

module.exports = {
  validateBody,
  validateQuery,
  validateParams,
  requestOfflineAccessSchema,
  updateOfflineDownloadStatusSchema,
  songEntitlementParamsSchema,
  downloadParamsSchema,
  entitlementQuerySchema,
  listDownloadsQuerySchema,
};
