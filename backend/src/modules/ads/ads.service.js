const { getEnv } = require('../../config/env');
const { AdsRepository } = require('../../repositories/ads.repository');
const { createAnalyticsTracker } = require('../../services/analyticsTracker');
const { buildEntitlementProfile } = require('../../services/entitlements');
const { AdsError } = require('./ads.errors');

const DEFAULT_INTERSTITIAL_RULES = {
  minTracksBetweenAds: 4,
  cooldownSeconds: 180,
  maxPerHour: 8,
  skipAfterSeconds: 5,
};

function normalizePlacement(rawName) {
  const name = String(rawName || '').toUpperCase();
  if (name.includes('[INTERSTITIAL]')) return 'INTERSTITIAL';
  if (name.includes('[REWARDED]')) return 'REWARDED';
  if (name.includes('[BANNER]')) return 'BANNER';
  if (name.includes('[PROMO]')) return 'PROMO';
  if (name.includes('[ANNOUNCEMENT]')) return 'ANNOUNCEMENT';
  return 'BANNER';
}

function toCampaignDto(campaign) {
  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    startsAt: campaign.startsAt,
    endsAt: campaign.endsAt,
    budgetCents: campaign.budgetCents,
    impressionsTarget: campaign.impressionsTarget,
    clicksTarget: campaign.clicksTarget,
    createdByUserId: campaign.createdByUserId,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
    placement: normalizePlacement(campaign.name),
  };
}

function toPromoBannerDto(promoCode) {
  return {
    id: promoCode.id,
    code: promoCode.code,
    title: promoCode.description || `Use code ${promoCode.code}`,
    discountType: promoCode.discountType,
    discountValue: Number(promoCode.discountValue),
    expiresAt: promoCode.expiresAt,
    isActive: promoCode.isActive,
  };
}

function toAnnouncementDto(notification) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    channel: notification.channel,
    status: notification.status,
    metadata: notification.metadata,
    createdAt: notification.createdAt,
  };
}

class AdsService {
  constructor({ adsRepository = new AdsRepository(), analyticsTracker = createAnalyticsTracker(), env = getEnv() } = {}) {
    this.adsRepository = adsRepository;
    this.analyticsTracker = analyticsTracker;
    this.env = env;
  }

  async trackAdInteraction(userId, input) {
    const eventName = input.interactionType === 'CLICK' ? 'ad_click' : 'ad_impression';
    await this.analyticsTracker.trackEvent({
      userId,
      eventName,
      properties: {
        campaignId: input.campaignId || null,
        placement: input.placement,
        creativeType: input.creativeType,
        metadata: input.metadata || null,
      },
    });

    return {
      tracked: true,
      eventName,
    };
  }

  async getAudienceProfile(userId) {
    const subscription = await this.adsRepository.getCurrentSubscription(userId);
    const entitlements = buildEntitlementProfile(subscription);
    return {
      subscription,
      entitlements,
      isPremium: entitlements.isPremium,
      isAdsAllowedForUser: !entitlements.adFree,
    };
  }

  async getCampaignInventory() {
    const campaigns = await this.adsRepository.listActiveCampaigns();
    return campaigns.map(toCampaignDto);
  }

  pickCampaignForPlacement(campaigns, placement) {
    const targeted = campaigns.filter((campaign) => campaign.placement === placement);
    if (targeted.length > 0) {
      return targeted[0];
    }

    if (placement === 'BANNER') {
      return campaigns.find((campaign) => campaign.placement === 'BANNER') || null;
    }

    return null;
  }

  async getBannerAd(userId, query = {}) {
    const audience = await this.getAudienceProfile(userId);
    const adsEnabled = this.env.ads.enabled && audience.isAdsAllowedForUser;

    if (!adsEnabled) {
      return {
        enabled: false,
        reason: this.env.ads.enabled ? 'PREMIUM_AD_FREE' : 'ADS_DISABLED',
        ad: null,
      };
    }

    const campaigns = await this.getCampaignInventory();
    const placement = query.placement || 'BANNER';
    const campaign = this.pickCampaignForPlacement(campaigns, 'BANNER');

    if (!campaign) {
      return {
        enabled: true,
        reason: 'NO_ACTIVE_CAMPAIGN',
        ad: null,
      };
    }

    return {
      enabled: true,
      reason: 'AVAILABLE',
      placement,
      ad: {
        campaignId: campaign.id,
        title: campaign.name,
        creativeType: 'BANNER',
        imageUrl: null,
        clickUrl: null,
        tracking: {
          impressionKey: `imp_${campaign.id}_${placement.toLowerCase()}`,
          clickKey: `clk_${campaign.id}_${placement.toLowerCase()}`,
        },
      },
    };
  }

  async getInterstitialRules(userId) {
    const audience = await this.getAudienceProfile(userId);
    const enabled = this.env.ads.enabled && audience.isAdsAllowedForUser;

    return {
      enabled,
      reason: enabled ? 'AVAILABLE' : this.env.ads.enabled ? 'PREMIUM_AD_FREE' : 'ADS_DISABLED',
      rules: enabled ? DEFAULT_INTERSTITIAL_RULES : null,
      campaignHint: enabled ? '[INTERSTITIAL]' : null,
    };
  }

  async getRewardedAd(userId) {
    const audience = await this.getAudienceProfile(userId);
    const enabled = this.env.ads.enabled && audience.isAdsAllowedForUser;
    const campaigns = enabled ? await this.getCampaignInventory() : [];
    const rewarded = this.pickCampaignForPlacement(campaigns, 'REWARDED');

    return {
      enabled,
      reason: enabled ? 'AVAILABLE' : this.env.ads.enabled ? 'PREMIUM_AD_FREE' : 'ADS_DISABLED',
      ad: rewarded
        ? {
            campaignId: rewarded.id,
            title: rewarded.name,
            creativeType: 'REWARDED',
            reward: {
              kind: 'PREMIUM_PREVIEW_MINUTES',
              value: 30,
            },
            tracking: {
              completionKey: `rw_complete_${rewarded.id}`,
            },
          }
        : null,
    };
  }

  async listPromoBanners(_userId) {
    const promoCodes = await this.adsRepository.listActivePromoCodes(new Date(), 6);
    return {
      data: promoCodes.map(toPromoBannerDto),
      total: promoCodes.length,
    };
  }

  async listAnnouncements(userId) {
    const announcements = await this.adsRepository.listAnnouncements(userId, 6);
    return {
      data: announcements.map(toAnnouncementDto),
      total: announcements.length,
    };
  }

  async getAdFeed(userId, query = {}) {
    const audience = await this.getAudienceProfile(userId);
    const featureFlags = {
      adsEnabledGlobal: this.env.ads.enabled,
      adsEligibleForUser: audience.isAdsAllowedForUser,
      bannerAdsEnabled: this.env.ads.enabled && audience.isAdsAllowedForUser,
      interstitialAdsEnabled: this.env.ads.enabled && audience.isAdsAllowedForUser,
      rewardedAdsEnabled: this.env.ads.enabled && audience.isAdsAllowedForUser,
      promoBannersEnabled: true,
      announcementsEnabled: true,
    };

    const [banner, interstitial, rewarded, promoBanners, announcements] = await Promise.all([
      this.getBannerAd(userId, query),
      this.getInterstitialRules(userId),
      this.getRewardedAd(userId),
      this.listPromoBanners(userId),
      this.listAnnouncements(userId),
    ]);

    return {
      featureFlags,
      audience: {
        tier: audience.entitlements.tier,
        isPremium: audience.entitlements.isPremium,
        adFree: audience.entitlements.adFree,
      },
      banner,
      interstitial,
      rewarded,
      promoBanners,
      announcements,
    };
  }

  async listAdminCampaigns(query = {}) {
    const campaigns = await this.adsRepository.listCampaigns(query);
    return {
      data: campaigns.map(toCampaignDto),
      total: campaigns.length,
    };
  }

  async createAdminCampaign(adminUserId, input) {
    const created = await this.adsRepository.createCampaign({
      name: input.name,
      status: input.status,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      budgetCents: input.budgetCents ?? null,
      impressionsTarget: input.impressionsTarget ?? null,
      clicksTarget: input.clicksTarget ?? null,
      createdByUserId: adminUserId,
    });

    return {
      campaign: toCampaignDto(created),
      metadata: input.metadata || null,
    };
  }

  async updateAdminCampaign(_adminUserId, campaignId, input) {
    const existing = await this.adsRepository.getCampaignById(campaignId);
    if (!existing) {
      throw new AdsError(404, 'CAMPAIGN_NOT_FOUND', 'Ad campaign was not found.');
    }

    const updates = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.startsAt !== undefined
        ? { startsAt: input.startsAt ? new Date(input.startsAt) : null }
        : {}),
      ...(input.endsAt !== undefined
        ? { endsAt: input.endsAt ? new Date(input.endsAt) : null }
        : {}),
      ...(input.budgetCents !== undefined ? { budgetCents: input.budgetCents } : {}),
      ...(input.impressionsTarget !== undefined ? { impressionsTarget: input.impressionsTarget } : {}),
      ...(input.clicksTarget !== undefined ? { clicksTarget: input.clicksTarget } : {}),
    };

    const result = await this.adsRepository.updateCampaignById(campaignId, updates);
    if (!result || result.count === 0) {
      throw new AdsError(404, 'CAMPAIGN_NOT_FOUND', 'Ad campaign was not found.');
    }

    const updated = await this.adsRepository.getCampaignById(campaignId);
    return {
      campaign: toCampaignDto(updated),
      metadata: input.metadata || null,
    };
  }
}

function createAdsService(dependencies) {
  return new AdsService(dependencies);
}

module.exports = {
  AdsService,
  createAdsService,
};