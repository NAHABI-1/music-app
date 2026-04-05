const { createAdsService } = require('./ads.service');

function createAdsController(service) {
  const adsService = service || createAdsService();

  return {
    getAdFeed: async (request, response, next) => {
      try {
        const payload = await adsService.getAdFeed(request.auth.userId, request.validatedQuery);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    trackAdInteraction: async (request, response, next) => {
      try {
        const payload = await adsService.trackAdInteraction(request.auth.userId, request.validatedBody);
        response.status(201).json(payload);
      } catch (error) {
        next(error);
      }
    },

    getBannerAd: async (request, response, next) => {
      try {
        const payload = await adsService.getBannerAd(request.auth.userId, request.validatedQuery);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    getInterstitialRules: async (request, response, next) => {
      try {
        const payload = await adsService.getInterstitialRules(request.auth.userId);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    getRewardedAd: async (request, response, next) => {
      try {
        const payload = await adsService.getRewardedAd(request.auth.userId);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    listPromoBanners: async (request, response, next) => {
      try {
        const payload = await adsService.listPromoBanners(request.auth.userId);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    listAnnouncements: async (request, response, next) => {
      try {
        const payload = await adsService.listAnnouncements(request.auth.userId);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    listAdminCampaigns: async (request, response, next) => {
      try {
        const payload = await adsService.listAdminCampaigns(request.validatedQuery);
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },

    createAdminCampaign: async (request, response, next) => {
      try {
        const payload = await adsService.createAdminCampaign(request.auth.userId, request.validatedBody);
        response.status(201).json(payload);
      } catch (error) {
        next(error);
      }
    },

    updateAdminCampaign: async (request, response, next) => {
      try {
        const payload = await adsService.updateAdminCampaign(
          request.auth.userId,
          request.validatedParams.campaignId,
          request.validatedBody
        );
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  createAdsController,
};