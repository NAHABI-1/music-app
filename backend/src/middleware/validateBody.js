function validateBody(schema) {
  return (request, _response, next) => {
    const parsed = schema.safeParse(request.body || {});
    if (!parsed.success) {
      return next({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload.',
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    request.validatedBody = parsed.data;
    return next();
  };
}

module.exports = {
  validateBody,
};