const GB = 1024 * 1024 * 1024;

const PLAN_TIERS = {
  FREE: 'FREE',
  PREMIUM: 'PREMIUM',
};

const PLAN_CATALOG = [
  {
    code: 'FREE',
    name: 'Free',
    description: 'Ad-supported listening with limited offline and storage access.',
    interval: 'LIFETIME',
    priceCents: 0,
    currency: 'USD',
    isActive: true,
    badge: 'Free forever',
  },
  {
    code: 'PREMIUM_MONTHLY',
    name: 'Premium Monthly',
    description: 'Ad-free listening with more storage, offline downloads, and high-quality audio.',
    interval: 'MONTHLY',
    priceCents: 999,
    currency: 'USD',
    isActive: true,
    badge: 'Most flexible',
  },
  {
    code: 'PREMIUM_YEARLY',
    name: 'Premium Yearly',
    description: 'Best-value premium access with all plan benefits included.',
    interval: 'YEARLY',
    priceCents: 9999,
    currency: 'USD',
    isActive: true,
    badge: 'Best value',
  },
];

const FEATURE_COMPARISON = [
  {
    key: 'adFreeListening',
    label: 'Ad-free listening',
    description: 'Premium removes ads from playback.',
    freeValue: 'No',
    premiumValue: 'Yes',
  },
  {
    key: 'storageLimit',
    label: 'Cloud storage limit',
    description: 'Free users get a smaller cloud storage allowance.',
    freeValue: '5 GB',
    premiumValue: '100 GB',
  },
  {
    key: 'offlineDownloads',
    label: 'Offline downloads',
    description: 'Premium unlocks a much larger download library.',
    freeValue: '3 songs',
    premiumValue: '500 songs',
  },
  {
    key: 'audioQuality',
    label: 'Maximum audio quality',
    description: 'Premium is entitled to the highest quality stream variants.',
    freeValue: 'Medium',
    premiumValue: 'Lossless',
  },
  {
    key: 'prioritySupport',
    label: 'Priority support',
    description: 'Premium subscribers receive priority support handling.',
    freeValue: 'No',
    premiumValue: 'Yes',
  },
];

const QUALITY_PROFILE = {
  AUTO: { targetKbps: 160 },
  LOW: { targetKbps: 64 },
  MEDIUM: { targetKbps: 128 },
  HIGH: { targetKbps: 256 },
  LOSSLESS: { targetKbps: 1411 },
};

const QUALITY_ORDER = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  LOSSLESS: 4,
};

const LIMITS_BY_TIER = {
  FREE: {
    storageLimitBytes: 5 * GB,
    offlineDownloadLimit: 3,
    offlineDownloadExpiryHours: 72,
    maxAudioQuality: 'MEDIUM',
    adFree: false,
  },
  PREMIUM: {
    storageLimitBytes: 100 * GB,
    offlineDownloadLimit: 500,
    offlineDownloadExpiryHours: 30 * 24,
    maxAudioQuality: 'LOSSLESS',
    adFree: true,
  },
};

function normalizePlanCode(planCode) {
  return String(planCode || '').trim().toUpperCase();
}

function resolvePlanTier(subscription) {
  if (!subscription || !subscription.plan || subscription.plan.isActive === false) {
    return PLAN_TIERS.FREE;
  }

  const status = String(subscription.status || '').toUpperCase();
  if (!['ACTIVE', 'TRIALING'].includes(status)) {
    return PLAN_TIERS.FREE;
  }

  const periodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
  if (periodEnd && periodEnd < new Date()) {
    return PLAN_TIERS.FREE;
  }

  const code = normalizePlanCode(subscription.plan.code);
  if (!code || code === 'FREE' || code.includes('FREE')) {
    return PLAN_TIERS.FREE;
  }

  return PLAN_TIERS.PREMIUM;
}

function getFeatureLimitsForTier(tier) {
  return LIMITS_BY_TIER[tier] || LIMITS_BY_TIER.FREE;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${Math.round(value * 10) / 10} ${units[unitIndex]}`;
}

function buildEntitlementProfile(subscription) {
  const tier = resolvePlanTier(subscription);
  const limits = getFeatureLimitsForTier(tier);

  return {
    tier,
    isPremium: tier === PLAN_TIERS.PREMIUM,
    adFree: limits.adFree,
    storageLimitBytes: limits.storageLimitBytes,
    storageLimitLabel: formatBytes(limits.storageLimitBytes),
    offlineDownloadLimit: limits.offlineDownloadLimit,
    offlineDownloadExpiryHours: limits.offlineDownloadExpiryHours,
    maxAudioQuality: limits.maxAudioQuality,
    supportedQualities:
      tier === PLAN_TIERS.PREMIUM ? ['LOW', 'MEDIUM', 'HIGH', 'LOSSLESS'] : ['LOW', 'MEDIUM'],
    subscriptionStatus: subscription ? subscription.status : 'NONE',
    planCode: subscription?.plan?.code || null,
  };
}

function buildPlanComparison(plans) {
  const nextPlans = Array.isArray(plans) && plans.length ? plans : PLAN_CATALOG;
  const planCards = nextPlans.map((plan) => {
    const tier = resolvePlanTier({
      status: 'ACTIVE',
      plan: {
        code: plan.code,
        isActive: plan.isActive !== false,
      },
    });

    const limits = getFeatureLimitsForTier(tier);

    return {
      code: plan.code,
      name: plan.name,
      description: plan.description,
      interval: plan.interval,
      priceCents: plan.priceCents,
      currency: plan.currency,
      isActive: plan.isActive !== false,
      badge: plan.badge || null,
      tier,
      featureSummary: {
        adFree: limits.adFree,
        storageLimitBytes: limits.storageLimitBytes,
        storageLimitLabel: formatBytes(limits.storageLimitBytes),
        offlineDownloadLimit: limits.offlineDownloadLimit,
        maxAudioQuality: limits.maxAudioQuality,
      },
    };
  });

  const matrix = FEATURE_COMPARISON.map((feature) => {
    const values = {};
    planCards.forEach((plan) => {
      values[plan.code] = plan.tier === PLAN_TIERS.PREMIUM ? feature.premiumValue : feature.freeValue;
    });

    return {
      key: feature.key,
      label: feature.label,
      description: feature.description,
      values,
    };
  });

  return {
    plans: planCards,
    features: FEATURE_COMPARISON,
    matrix,
  };
}

function normalizeAudioQualitySelection(requestedQuality, lowDataMode, subscription) {
  const requested = normalizePlanCode(requestedQuality) || 'AUTO';
  const entitlement = buildEntitlementProfile(subscription);
  let effective = requested;

  if (requested === 'AUTO') {
    effective = lowDataMode ? 'LOW' : 'MEDIUM';
  }

  if (lowDataMode) {
    effective = 'LOW';
  }

  const maxAllowed = entitlement.maxAudioQuality || 'MEDIUM';
  if ((QUALITY_ORDER[effective] || 0) > (QUALITY_ORDER[maxAllowed] || QUALITY_ORDER.MEDIUM)) {
    effective = maxAllowed;
  }

  return {
    requested,
    effective,
    profile: QUALITY_PROFILE[effective] || QUALITY_PROFILE.MEDIUM,
    tier: entitlement.tier,
  };
}

function getOfflineLimitForTier(tier) {
  return getFeatureLimitsForTier(tier).offlineDownloadLimit;
}

function getExpiryForTier(tier) {
  const hours = getFeatureLimitsForTier(tier).offlineDownloadExpiryHours;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

module.exports = {
  PLAN_TIERS,
  PLAN_CATALOG,
  FEATURE_COMPARISON,
  QUALITY_PROFILE,
  buildEntitlementProfile,
  buildPlanComparison,
  formatBytes,
  getExpiryForTier,
  getFeatureLimitsForTier,
  getOfflineLimitForTier,
  normalizeAudioQualitySelection,
  normalizePlanCode,
  resolvePlanTier,
};