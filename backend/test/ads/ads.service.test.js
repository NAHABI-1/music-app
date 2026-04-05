const test = require('node:test');
const assert = require('node:assert/strict');

const { AdsService } = require('../../src/modules/ads/ads.service');
const { AdsError } = require('../../src/modules/ads/ads.errors');

function createEnv(overrides = {}) {
  return {
    ads: {
      enabled: true,
      provider: 'custom',
      ...overrides.ads,
    },
    ...overrides,
  };
}

function buildRepositoryMock() {
  return {
    getCurrentSubscription: async () => null,
    listActiveCampaigns: async () => [],
    listActivePromoCodes: async () => [],
    listAnnouncements: async () => [],
    listCampaigns: async () => [],
    createCampaign: async () => null,
    getCampaignById: async () => null,
    updateCampaignById: async () => ({ count: 0 }),
  };
}

function makeCampaign(overrides = {}) {
  return {
    id: 'campaign-1',
    name: '[BANNER] Spring Promo',
    status: 'ACTIVE',
    startsAt: new Date('2026-04-01T00:00:00.000Z'),
    endsAt: new Date('2026-04-30T00:00:00.000Z'),
    budgetCents: 10000,
    impressionsTarget: 100000,
    clicksTarget: 5000,
    createdByUserId: 'admin-1',
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
    updatedAt: new Date('2026-04-01T00:00:00.000Z'),
    ...overrides,
  };
}

test('getAdFeed returns ad inventory for free users when ads are enabled', async () => {
  const repository = buildRepositoryMock();
  repository.getCurrentSubscription = async () => null;
  repository.listActiveCampaigns = async () => [makeCampaign()];
  repository.listActivePromoCodes = async () => [
    {
      id: 'promo-1',
      code: 'SAVE10',
      description: 'Save 10%',
      discountType: 'PERCENT',
      discountValue: 10,
      expiresAt: null,
      isActive: true,
    },
  ];
  repository.listAnnouncements = async () => [
    {
      id: 'announcement-1',
      type: 'ANNOUNCEMENT',
      title: 'New release',
      body: 'Check out this week\'s top tracks',
      channel: 'IN_APP',
      status: 'SENT',
      metadata: null,
      createdAt: new Date('2026-04-05T00:00:00.000Z'),
    },
  ];

  const service = new AdsService({ adsRepository: repository, env: createEnv() });
  const result = await service.getAdFeed('user-1', { placement: 'HOME' });

  assert.equal(result.featureFlags.adsEnabledGlobal, true);
  assert.equal(result.audience.isPremium, false);
  assert.equal(Boolean(result.banner.ad), true);
  assert.equal(result.promoBanners.total, 1);
  assert.equal(result.announcements.total, 1);
});

test('getAdFeed suppresses ads for premium users', async () => {
  const repository = buildRepositoryMock();
  repository.getCurrentSubscription = async () => ({
    status: 'ACTIVE',
    currentPeriodEnd: new Date('2026-05-05T00:00:00.000Z'),
    plan: {
      code: 'PREMIUM_MONTHLY',
      isActive: true,
    },
  });

  const service = new AdsService({ adsRepository: repository, env: createEnv() });
  const result = await service.getAdFeed('user-1', { placement: 'HOME' });

  assert.equal(result.audience.adFree, true);
  assert.equal(result.banner.enabled, false);
  assert.equal(result.interstitial.enabled, false);
  assert.equal(result.rewarded.enabled, false);
});

test('getAdFeed suppresses ads when global flag is disabled', async () => {
  const repository = buildRepositoryMock();
  repository.listActiveCampaigns = async () => [makeCampaign()];

  const service = new AdsService({
    adsRepository: repository,
    env: createEnv({ ads: { enabled: false, provider: 'custom' } }),
  });

  const result = await service.getAdFeed('user-1', { placement: 'HOME' });

  assert.equal(result.featureFlags.adsEnabledGlobal, false);
  assert.equal(result.banner.enabled, false);
  assert.equal(result.banner.reason, 'ADS_DISABLED');
});

test('createAdminCampaign includes admin ownership metadata', async () => {
  const repository = buildRepositoryMock();
  repository.createCampaign = async (data) => makeCampaign({ id: 'campaign-2', ...data });

  const service = new AdsService({ adsRepository: repository, env: createEnv() });
  const result = await service.createAdminCampaign('admin-42', {
    name: '[INTERSTITIAL] Evening Push',
    status: 'DRAFT',
  });

  assert.equal(result.campaign.createdByUserId, 'admin-42');
  assert.equal(result.campaign.placement, 'INTERSTITIAL');
});

test('updateAdminCampaign throws when campaign is missing', async () => {
  const repository = buildRepositoryMock();
  repository.getCampaignById = async () => null;

  const service = new AdsService({ adsRepository: repository, env: createEnv() });

  await assert.rejects(
    () => service.updateAdminCampaign('admin-1', 'missing-id', { status: 'PAUSED' }),
    (error) => error instanceof AdsError && error.code === 'CAMPAIGN_NOT_FOUND'
  );
});

test('trackAdInteraction records ad click event', async () => {
  let trackedPayload;
  const service = new AdsService({
    adsRepository: buildRepositoryMock(),
    env: createEnv(),
    analyticsTracker: {
      trackEvent: async (payload) => {
        trackedPayload = payload;
      },
    },
  });

  const result = await service.trackAdInteraction('user-1', {
    interactionType: 'CLICK',
    campaignId: 'campaign-1',
    placement: 'HOME',
    creativeType: 'BANNER',
  });

  assert.equal(result.tracked, true);
  assert.equal(trackedPayload.eventName, 'ad_click');
});

test('updateAdminCampaign returns updated campaign payload', async () => {
  const repository = buildRepositoryMock();
  repository.getCampaignById = async () => makeCampaign({ id: 'campaign-1' });
  repository.updateCampaignById = async () => ({ count: 1 });
  repository.getCampaignById = async () => makeCampaign({ id: 'campaign-1', status: 'PAUSED' });

  const service = new AdsService({ adsRepository: repository, env: createEnv() });
  const result = await service.updateAdminCampaign('admin-1', 'campaign-1', { status: 'PAUSED' });

  assert.equal(result.campaign.status, 'PAUSED');
});
