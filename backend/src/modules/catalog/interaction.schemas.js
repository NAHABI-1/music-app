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

const songPathParamsSchema = z.object({
  songId: uuidSchema,
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const trackRecentPlaySchema = z.object({
  songId: uuidSchema,
  playbackSource: z.enum(['STREAM', 'OFFLINE', 'CACHE']).default('STREAM'),
  playDurationSecs: z.number().int().min(0).optional(),
});

module.exports = {
  validateQuery,
  validateParams,
  validateBody,
  songPathParamsSchema,
  listQuerySchema,
  trackRecentPlaySchema,
};
