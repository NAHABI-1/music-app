const { createAdminService } = require('./admin.service');

function createAdminController(service) {
  const adminService = service || createAdminService();

  return {
    // ==================== USER MANAGEMENT ====================

    getUsers: async (request, response, next) => {
      try {
        const filters = {
          page: request.query.page ? parseInt(request.query.page) : 1,
          limit: request.query.limit ? parseInt(request.query.limit) : 20,
          search: request.query.search || '',
          sort: request.query.sort || 'desc',
          sortBy: request.query.sortBy || 'createdAt',
        };

        const result = await adminService.getUsers(filters);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    getUserDetails: async (request, response, next) => {
      try {
        const { userId } = request.params;
        const user = await adminService.getUserDetails(userId);
        response.status(200).json(user);
      } catch (error) {
        next(error);
      }
    },

    suspendUser: async (request, response, next) => {
      try {
        const { userId } = request.params;
        const result = await adminService.suspendUser(userId, request.validatedBody);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    activateUser: async (request, response, next) => {
      try {
        const { userId } = request.params;
        const result = await adminService.activateUser(userId, request.validatedBody);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    deleteUser: async (request, response, next) => {
      try {
        const { userId } = request.params;
        const result = await adminService.deleteUser(userId, request.validatedBody);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    updateUserRole: async (request, response, next) => {
      try {
        const { userId } = request.params;
        const result = await adminService.updateUserRole(userId, request.validatedBody);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    // ==================== CONTENT MODERATION ====================

    getUploadsForReview: async (request, response, next) => {
      try {
        const filters = {
          page: request.query.page ? parseInt(request.query.page) : 1,
          limit: request.query.limit ? parseInt(request.query.limit) : 20,
          sort: request.query.sort || 'asc',
        };

        const result = await adminService.getUploadsForReview(filters);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    reviewUpload: async (request, response, next) => {
      try {
        const { uploadId } = request.params;
        const result = await adminService.reviewUpload(uploadId, request.validatedBody);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    blockSong: async (request, response, next) => {
      try {
        const { songId } = request.params;
        const result = await adminService.blockSong(songId, request.validatedBody);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    unblockSong: async (request, response, next) => {
      try {
        const { songId } = request.params;
        const result = await adminService.unblockSong(songId, request.validatedBody);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    // ==================== PROMO CODE MANAGEMENT ====================

    getPromoCodes: async (request, response, next) => {
      try {
        const filters = {
          page: request.query.page ? parseInt(request.query.page) : 1,
          limit: request.query.limit ? parseInt(request.query.limit) : 20,
          isActive: request.query.isActive === 'true' ? true : request.query.isActive === 'false' ? false : undefined,
        };

        const result = await adminService.getPromoCodes(filters);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    createPromoCode: async (request, response, next) => {
      try {
        const result = await adminService.createPromoCode(request.validatedBody, request.auth.userId);
        response.status(201).json(result);
      } catch (error) {
        next(error);
      }
    },

    updatePromoCode: async (request, response, next) => {
      try {
        const { codeId } = request.params;
        const result = await adminService.updatePromoCode(codeId, request.validatedBody);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    deletePromoCode: async (request, response, next) => {
      try {
        const { codeId } = request.params;
        const result = await adminService.deletePromoCode(codeId);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    // ==================== PLAN MANAGEMENT ====================

    getPlans: async (request, response, next) => {
      try {
        const filters = {
          isActive: request.query.isActive === 'true' ? true : request.query.isActive === 'false' ? false : undefined,
        };

        const result = await adminService.getPlans(filters);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    createPlan: async (request, response, next) => {
      try {
        const result = await adminService.createPlan(request.validatedBody);
        response.status(201).json(result);
      } catch (error) {
        next(error);
      }
    },

    updatePlan: async (request, response, next) => {
      try {
        const { planId } = request.params;
        const result = await adminService.updatePlan(planId, request.validatedBody);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    deletePlan: async (request, response, next) => {
      try {
        const { planId } = request.params;
        const result = await adminService.deletePlan(planId);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    // ==================== ANALYTICS & REPORTING ====================

    getDashboardStats: async (request, response, next) => {
      try {
        const { startDate, endDate } = request.query;

        if (!startDate || !endDate) {
          return response.status(400).json({
            error: 'startDate and endDate query parameters are required',
          });
        }

        const result = await adminService.getDashboardStats(startDate, endDate);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    getUserGrowthMetrics: async (request, response, next) => {
      try {
        const { startDate, endDate, breakdown } = request.query;

        if (!startDate || !endDate) {
          return response.status(400).json({
            error: 'startDate and endDate query parameters are required',
          });
        }

        const result = await adminService.getUserGrowthMetrics(startDate, endDate, breakdown || 'DAILY');
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    // ==================== NOTIFICATIONS ====================

    sendNotification: async (request, response, next) => {
      try {
        const result = await adminService.sendNotification(request.validatedBody);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = { createAdminController };
