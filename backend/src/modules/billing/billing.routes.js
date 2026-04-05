const express = require('express');

const { requireAuth } = require('../auth/auth.middleware');
const { createBillingController } = require('./billing.controller');
const {
  validateBody,
  validateParams,
  validateQuery,
  checkoutSessionSchema,
  planQuerySchema,
  promoCodeBodySchema,
  webhookEventSchema,
  webhookParamsSchema,
} = require('./billing.schemas');

function createBillingRouter(options = {}) {
  const router = express.Router();
  const authGuard = options.requireAuth || requireAuth;
  const controller = options.controller || createBillingController();

  router.get('/plans', validateQuery(planQuerySchema), controller.listPlans);
  router.get('/plans/comparison', validateQuery(planQuerySchema), controller.getFeatureComparison);
  router.get('/plans/upsell', controller.getPublicUpsellData);

  router.get('/status', authGuard(), controller.getSubscriptionStatus);
  router.get('/entitlements', authGuard(), controller.getEntitlements);
  router.get('/upsell', authGuard(), controller.getUpsellData);
  router.get('/payments/config', authGuard(), controller.getPaymentConfig);

  router.post('/promo-codes/validate', authGuard(), validateBody(promoCodeBodySchema), controller.validatePromoCode);
  router.post('/promo-codes/redeem', authGuard(), validateBody(promoCodeBodySchema), controller.redeemPromoCode);
  router.post('/checkout', authGuard(), validateBody(checkoutSessionSchema), controller.createCheckoutSession);

  router.post(
    '/webhooks/:provider',
    validateParams(webhookParamsSchema),
    validateBody(webhookEventSchema),
    controller.handleWebhook
  );

  return router;
}

module.exports = {
  createBillingRouter,
};