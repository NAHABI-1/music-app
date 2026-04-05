const { createAnalyticsService } = require('./analytics.service');

function createAnalyticsController(service) {
  const analyticsService = service || createAnalyticsService();

  return {
    ingestEvent: async (request, response, next) => {
      try {
        const payload = await analyticsService.ingestEvent(request.auth.userId, request.validatedBody);
        response.status(201).json(payload);
      } catch (error) {
        next(error);
      }
    },

    ingestEventsBatch: async (request, response, next) => {
      try {
        const payload = await analyticsService.ingestEventsBatch(request.auth.userId, request.validatedBody);
        response.status(201).json(payload);
      } catch (error) {
        next(error);
      }
    },

    getUserSummary: async (request, response, next) => {
      try {
        const payload = await analyticsService.getUserSummary(request.auth.userId, request.validatedQuery);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    getAdminOverview: async (request, response, next) => {
      try {
        const payload = await analyticsService.getAdminOverview(request.validatedQuery);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    getAdminEventsReport: async (request, response, next) => {
      try {
        const payload = await analyticsService.getAdminEventsReport(request.validatedQuery);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  createAnalyticsController,
};