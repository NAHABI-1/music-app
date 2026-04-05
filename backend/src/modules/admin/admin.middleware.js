const { AdminError } = require('./admin.errors');

function requireAdmin() {
  return (_request, _response, next) => {
    try {
      // Extract auth info from request (set by auth middleware)
      const auth = _request.auth;

      if (!auth) {
        throw new AdminError(401, 'AUTH_REQUIRED', 'Authentication is required.');
      }

      if (auth.role !== 'ADMIN') {
        throw new AdminError(403, 'ADMIN_REQUIRED', 'Only administrators can access this resource.');
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

function logAdminAction(action, targetType, targetId, details = {}) {
  // This middleware creates audit log entries for all admin actions
  return async (request, _response, next) => {
    try {
      const auth = request.auth;

      if (!auth || auth.role !== 'ADMIN') {
        return next();
      }

      // Attach audit log data to request for use in controllers
      request.auditLog = {
        action,
        targetType,
        targetId,
        details,
        adminId: auth.userId,
        timestamp: new Date(),
        ipAddress: request.ip || request.socket?.remoteAddress || null,
        userAgent: request.headers['user-agent'] || null,
      };

      // Store in audit log after response (use finish event)
      _response.on('finish', async () => {
        try {
          // Only log successful operations (2xx status codes)
          if (_response.statusCode >= 200 && _response.statusCode < 300) {
            // In a real implementation, you'd store this in a dedicated audit_logs table
            // For now, we'll just add metadata to track this
            console.log('[ADMIN_AUDIT]', JSON.stringify(request.auditLog));
          }
        } catch (err) {
          console.error('Failed to log admin action:', err);
        }
      });

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = { requireAdmin, logAdminAction };
