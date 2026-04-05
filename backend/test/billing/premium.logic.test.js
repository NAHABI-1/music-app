const test = require('node:test');
const assert = require('node:assert/strict');

const {
  resolvePlanTier,
  buildEntitlementProfile,
  normalizeAudioQualitySelection,
  PLAN_TIERS,
} = require('../../src/services/entitlements');

test('resolvePlanTier returns FREE for expired premium subscription', async () => {
  const tier = resolvePlanTier({
    status: 'ACTIVE',
    currentPeriodEnd: new Date(Date.now() - 60_000),
    plan: {
      code: 'PREMIUM_MONTHLY',
      isActive: true,
    },
  });

  assert.equal(tier, PLAN_TIERS.FREE);
});

test('buildEntitlementProfile returns premium capabilities for active premium plan', async () => {
  const profile = buildEntitlementProfile({
    status: 'ACTIVE',
    currentPeriodEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
    plan: {
      code: 'PREMIUM_YEARLY',
      isActive: true,
    },
  });

  assert.equal(profile.isPremium, true);
  assert.equal(profile.adFree, true);
  assert.equal(profile.maxAudioQuality, 'LOSSLESS');
  assert.equal(profile.offlineDownloadLimit, 500);
});

test('normalizeAudioQualitySelection enforces tier cap for free users', async () => {
  const quality = normalizeAudioQualitySelection('LOSSLESS', false, {
    status: 'ACTIVE',
    plan: {
      code: 'FREE',
      isActive: true,
    },
  });

  assert.equal(quality.effective, 'MEDIUM');
  assert.equal(quality.tier, PLAN_TIERS.FREE);
});

test('normalizeAudioQualitySelection forces LOW in low data mode even for premium', async () => {
  const quality = normalizeAudioQualitySelection('LOSSLESS', true, {
    status: 'ACTIVE',
    currentPeriodEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
    plan: {
      code: 'PREMIUM_MONTHLY',
      isActive: true,
    },
  });

  assert.equal(quality.effective, 'LOW');
  assert.equal(quality.tier, PLAN_TIERS.PREMIUM);
});
