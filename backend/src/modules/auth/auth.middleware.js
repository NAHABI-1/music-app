const { getEnv } = require('../../config/env');
const { AuthError } = require('./auth.errors');
const { verifyAccessToken } = require('./auth.tokens');

function extractBearerToken(headerValue) {
  if (!headerValue) {
    return null;
  }

  const [scheme, token] = headerValue.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token.trim();
}

function requireAuth(options = {}) {
  const prisma = options.prisma || require('../../repositories/prismaClient').prisma;
  const env = options.env || getEnv();

  return async (request, _response, next) => {
    try {
      const token = extractBearerToken(request.headers.authorization);
      if (!token) {
        throw new AuthError(401, 'AUTH_REQUIRED', 'Authentication is required.');
      }

      const payload = verifyAccessToken(token, env);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, status: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new AuthError(401, 'INVALID_TOKEN', 'Authentication is required.');
      }

      request.auth = {
        userId: user.id,
        role: user.role,
        email: user.email,
      };

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

function requireRole(roles) {
  const acceptedRoles = Array.isArray(roles) ? roles : [roles];

  return (request, _response, next) => {
    if (!request.auth) {
      return next(new AuthError(401, 'AUTH_REQUIRED', 'Authentication is required.'));
    }

    if (!acceptedRoles.includes(request.auth.role)) {
      return next(new AuthError(403, 'FORBIDDEN', 'You do not have permission for this resource.'));
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
  extractBearerToken,
};
