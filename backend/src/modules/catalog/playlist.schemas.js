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

const uuidSchema = z.string().uuid();

const listPlaylistsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
}).strict();

const createPlaylistSchema = z.object({
  title: z.string().min(1).max(180),
  description: z.string().max(2000).optional(),
});

const renamePlaylistSchema = z.object({
  title: z.string().min(1).max(180),
});

const addSongToPlaylistSchema = z.object({
  songId: uuidSchema,
  position: z.number().int().min(1).optional(),
});

const reorderPlaylistItemsSchema = z
  .object({
    itemIds: z.array(uuidSchema).min(1).max(2000),
  })
  .superRefine((input, context) => {
    const seen = new Set();
    input.itemIds.forEach((itemId, index) => {
      if (seen.has(itemId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['itemIds', index],
          message: 'Playlist reorder list cannot include duplicate item IDs.',
        });
      }
      seen.add(itemId);
    });
  });

const playlistPathParamsSchema = z.object({
  playlistId: uuidSchema,
});

const songPathParamsSchema = z.object({
  playlistId: uuidSchema,
  songId: uuidSchema,
});

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

module.exports = {
  validateBody,
  validateQuery,
  validateParams,
  listPlaylistsQuerySchema,
  createPlaylistSchema,
  renamePlaylistSchema,
  addSongToPlaylistSchema,
  reorderPlaylistItemsSchema,
  playlistPathParamsSchema,
  songPathParamsSchema,
};
