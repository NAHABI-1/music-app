const express = require('express');

const { requireAuth, requireRole } = require('../auth/auth.middleware');
const { createAdsController } = require('./ads.controller');
const {
  validateBody,
  validateParams,
  validateQuery,
  campaignIdParamsSchema,
  campaignQuerySchema,
  feedQuerySchema,
  adInteractionSchema,
  createCampaignSchema,
  updateCampaignSchema,
} = require('./ads.schemas');

function createAdsRouter(options = {}) {
  const router = express.Router();
  const authGuard = options.requireAuth || requireAuth;
  const roleGuard = options.requireRole || requireRole;
  const controller = options.controller || createAdsController();

  router.get('/feed', authGuard(), validateQuery(feedQuerySchema), controller.getAdFeed);
  router.get('/banner', authGuard(), validateQuery(feedQuerySchema), controller.getBannerAd);
  router.get('/interstitial-rules', authGuard(), controller.getInterstitialRules);
  router.get('/rewarded', authGuard(), controller.getRewardedAd);
  router.get('/promo-banners', authGuard(), controller.listPromoBanners);
  router.get('/announcements', authGuard(), controller.listAnnouncements);
  router.post('/events', authGuard(), validateBody(adInteractionSchema), controller.trackAdInteraction);

  router.get('/admin/campaigns', authGuard(), roleGuard('ADMIN'), validateQuery(campaignQuerySchema), controller.listAdminCampaigns);
  router.post('/admin/campaigns', authGuard(), roleGuard('ADMIN'), validateBody(createCampaignSchema), controller.createAdminCampaign);
  router.patch(
    '/admin/campaigns/:campaignId',
    authGuard(),
    roleGuard('ADMIN'),
    validateParams(campaignIdParamsSchema),
    validateBody(updateCampaignSchema),
    controller.updateAdminCampaign
  );

  return router;
}

module.exports = {
  createAdsRouter,
};