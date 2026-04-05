const { createBillingService } = require('./billing.service');

function createBillingController(service) {
  const billingService = service || createBillingService();

  return {
    listPlans: async (request, response, next) => {
      try {
        const payload = await billingService.listPlans(request.validatedQuery);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    getFeatureComparison: async (request, response, next) => {
      try {
        const payload = await billingService.getFeatureComparison(request.validatedQuery);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    getPublicUpsellData: async (request, response, next) => {
      try {
        const userId = request.auth?.userId || null;
        const payload = await billingService.getUpsellData(userId);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    getSubscriptionStatus: async (request, response, next) => {
      try {
        const payload = await billingService.getSubscriptionStatus(request.auth.userId);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    getEntitlements: async (request, response, next) => {
      try {
        const payload = await billingService.getEntitlements(request.auth.userId);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    getUpsellData: async (request, response, next) => {
      try {
        const payload = await billingService.getUpsellData(request.auth.userId);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    getPaymentConfig: async (_request, response, next) => {
      try {
        response.status(200).json(billingService.getPaymentConfig());
      } catch (error) {
        next(error);
      }
    },

    validatePromoCode: async (request, response, next) => {
      try {
        const payload = await billingService.validatePromoCode(request.validatedBody);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    redeemPromoCode: async (request, response, next) => {
      try {
        const payload = await billingService.redeemPromoCode(request.auth.userId, request.validatedBody);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    createCheckoutSession: async (request, response, next) => {
      try {
        const payload = await billingService.createCheckoutSession(request.auth.userId, request.validatedBody);
        response.status(201).json(payload);
      } catch (error) {
        next(error);
      }
    },

    handleWebhook: async (request, response, next) => {
      try {
        const payload = await billingService.handleWebhook(request.validatedParams.provider, request.validatedBody);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  createBillingController,
};