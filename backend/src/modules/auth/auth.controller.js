const { createAuthService } = require('./auth.service');

function createAuthController(service) {
  const authService = service || createAuthService();

  return {
    signup: async (request, response, next) => {
      try {
        const result = await authService.signup(request.validatedBody, {
          request,
          deviceId: request.validatedBody.deviceId,
        });
        response.status(201).json(result);
      } catch (error) {
        next(error);
      }
    },

    login: async (request, response, next) => {
      try {
        const result = await authService.login(request.validatedBody, {
          request,
          deviceId: request.validatedBody.deviceId,
        });
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    refresh: async (request, response, next) => {
      try {
        const result = await authService.refresh(request.validatedBody.refreshToken, { request });
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    logout: async (request, response, next) => {
      try {
        const result = await authService.logout(request.validatedBody.refreshToken);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    me: async (request, response, next) => {
      try {
        response.status(200).json({ user: request.auth });
      } catch (error) {
        next(error);
      }
    },

    socialGoogle: async (request, response, next) => {
      try {
        const result = await authService.socialLogin('google', request.validatedBody, {
          request,
          deviceId: request.validatedBody.deviceId,
        });
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    socialApple: async (request, response, next) => {
      try {
        const result = await authService.socialLogin('apple', request.validatedBody, {
          request,
          deviceId: request.validatedBody.deviceId,
        });
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = { createAuthController };
