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

const startPlaybackSessionSchema = z.object({
  songId: uuidSchema,
  quality: z.enum(['AUTO', 'LOW', 'MEDIUM', 'HIGH', 'LOSSLESS']).default('AUTO'),
  lowDataMode: z.boolean().default(false),
  playbackSource: z.enum(['STREAM', 'OFFLINE', 'CACHE']).default('STREAM'),
  resumePositionSecs: z.number().int().min(0).optional(),
  deviceSessionId: uuidSchema.optional(),
});

const updatePlaybackProgressSchema = z.object({
  positionSecs: z.number().int().min(0),
  bufferedSecs: z.number().int().min(0).optional(),
  playbackState: z.enum(['PLAYING', 'PAUSED', 'BUFFERING']).default('PLAYING'),
  emitAnalyticsEvent: z.boolean().default(false),
});

const endPlaybackSessionSchema = z.object({
  finalPositionSecs: z.number().int().min(0).optional(),
  endedReason: z.enum(['COMPLETED', 'STOPPED', 'INTERRUPTED', 'ERROR']).default('STOPPED'),
});

const sessionPathSchema = z.object({
  sessionId: uuidSchema,
});

const songPathSchema = z.object({
  songId: uuidSchema,
});

const listEventsQuerySchema = z.object({
  includeEvents: z.boolean().optional().default(false),
});

module.exports = {
  validateBody,
  validateQuery,
  validateParams,
  startPlaybackSessionSchema,
  updatePlaybackProgressSchema,
  endPlaybackSessionSchema,
  sessionPathSchema,
  songPathSchema,
  listEventsQuerySchema,
};
