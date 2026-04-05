const { z } = require('zod');

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

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  q: z.string().trim().max(120).optional(),
}).strict();

const listSongsQuerySchema = paginationQuerySchema.extend({
  filter: z.enum(['all', 'favorites', 'recent', 'uploads']).default('all'),
});

const searchSongsQuerySchema = paginationQuerySchema.extend({
  q: z.string().min(1).max(120),
});

const searchCollectionsQuerySchema = paginationQuerySchema.extend({
  q: z.string().min(1).max(120),
});

module.exports = {
  validateQuery,
  paginationQuerySchema,
  listSongsQuerySchema,
  searchSongsQuerySchema,
  searchCollectionsQuerySchema,
};
