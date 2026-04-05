const test = require('node:test');
const assert = require('node:assert/strict');

const { BillingService } = require('../../src/modules/billing/billing.service');

function createEnv(overrides = {}) {
  return {
    app: { env: 'development' },
    subscriptions: {
      enabled: true,
      provider: 'stripe',
      webhookSecret: 'test-webhook-secret',
      defaultPlanCode: 'FREE',
      trialDays: 14,
      ...overrides.subscriptions,
    },
    ...overrides,
  };
}

function createRepositoryMock() {
  return {
    listPlans: async () => [],
    getPlanByCode: async () => null,
    getCurrentSubscription: async () => null,
    getPromoCodeByCode: async () => null,
    incrementPromoCodeRedemptionCount: async () => ({}),
    createPayment: async () => null,
    findPaymentByProviderRef: async () => null,
    updatePaymentById: async () => ({ count: 0 }),
    updateSubscriptionById: async () => ({ count: 0 }),
  };
}

test('getSubscriptionStatus exposes premium entitlements', async () => {
  const repository = createRepositoryMock();
  repository.getCurrentSubscription = async () => ({
    id: 'sub-1',
    userId: 'user-1',
    planId: 'plan-1',
    status: 'ACTIVE',
    startsAt: new Date('2026-01-01T00:00:00.000Z'),
    currentPeriodStart: new Date('2026-04-01T00:00:00.000Z'),
    currentPeriodEnd: new Date('2026-05-01T00:00:00.000Z'),
    cancelAt: null,
    endedAt: null,
    externalRef: 'sub_ext_1',
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
    updatedAt: new Date('2026-04-01T00:00:00.000Z'),
    plan: {
      id: 'plan-1',
      code: 'PREMIUM_MONTHLY',
      name: 'Premium Monthly',
      description: 'Premium plan',
      interval: 'MONTHLY',
      priceCents: 999,
      currency: 'USD',
      isActive: true,
    },
  });

  const service = new BillingService({ billingRepository: repository, env: createEnv() });
  const result = await service.getSubscriptionStatus('user-1');

  assert.equal(result.entitlements.isPremium, true);
  assert.equal(result.entitlements.adFree, true);
  assert.equal(result.entitlements.offlineDownloadLimit, 500);
  assert.equal(result.entitlements.maxAudioQuality, 'LOSSLESS');
  assert.equal(result.subscription.status, 'ACTIVE');
});

test('validatePromoCode calculates percentage discounts', async () => {
  const repository = createRepositoryMock();
  repository.getPromoCodeByCode = async () => ({
    id: 'promo-1',
    code: 'WELCOME25',
    description: '25 percent off',
    discountType: 'PERCENT',
    discountValue: 25,
    maxRedemptions: 10,
    redeemedCount: 2,
    startsAt: null,
    expiresAt: null,
    isActive: true,
  });

  const service = new BillingService({ billingRepository: repository, env: createEnv() });
  const result = await service.validatePromoCode({ code: 'WELCOME25', amountCents: 1000 });

  assert.equal(result.valid, true);
  assert.equal(result.discount.discountCents, 250);
  assert.equal(result.discount.finalAmountCents, 750);
});

test('createCheckoutSession rejects invalid promo codes', async () => {
  const repository = createRepositoryMock();
  repository.getPlanByCode = async () => ({
    id: 'plan-1',
    code: 'PREMIUM_MONTHLY',
    name: 'Premium Monthly',
    description: 'Premium plan',
    interval: 'MONTHLY',
    priceCents: 999,
    currency: 'USD',
    isActive: true,
  });

  const service = new BillingService({ billingRepository: repository, env: createEnv() });

  await assert.rejects(
    () =>
      service.createCheckoutSession('user-1', {
        planCode: 'PREMIUM_MONTHLY',
        promoCode: 'BADCODE',
      }),
    (error) => error.code === 'PROMO_CODE_INVALID'
  );
});

test('createCheckoutSession returns scaffolded payment payload', async () => {
  const repository = createRepositoryMock();
  repository.getPlanByCode = async () => ({
    id: 'plan-1',
    code: 'PREMIUM_MONTHLY',
    name: 'Premium Monthly',
    description: 'Premium plan',
    interval: 'MONTHLY',
    priceCents: 999,
    currency: 'USD',
    isActive: true,
  });
  repository.getPromoCodeByCode = async () => ({
    id: 'promo-1',
    code: 'SAVE10',
    description: '10 percent off',
    discountType: 'PERCENT',
    discountValue: 10,
    maxRedemptions: 10,
    redeemedCount: 0,
    startsAt: null,
    expiresAt: null,
    isActive: true,
  });
  repository.createPayment = async (data) => ({
    id: 'payment-1',
    ...data,
    createdAt: new Date('2026-04-05T00:00:00.000Z'),
    updatedAt: new Date('2026-04-05T00:00:00.000Z'),
    plan: {
      id: 'plan-1',
      code: 'PREMIUM_MONTHLY',
      name: 'Premium Monthly',
      description: 'Premium plan',
      interval: 'MONTHLY',
      priceCents: 999,
      currency: 'USD',
      isActive: true,
    },
    promoCode: null,
  });

  const service = new BillingService({ billingRepository: repository, env: createEnv() });
  const result = await service.createCheckoutSession('user-1', {
    planCode: 'PREMIUM_MONTHLY',
    promoCode: 'SAVE10',
  });

  assert.equal(result.payment.amountCents, 899);
  assert.equal(result.integration.provider, 'stripe');
  assert.equal(result.discount.discountCents, 100);
});

test('handleWebhook acknowledges payment provider events', async () => {
  const repository = createRepositoryMock();
  repository.findPaymentByProviderRef = async () => ({
    id: 'payment-1',
  });
  let updatedPayment;
  repository.updatePaymentById = async (paymentId, data) => {
    updatedPayment = { paymentId, data };
    return { count: 1 };
  };

  const service = new BillingService({ billingRepository: repository, env: createEnv() });
  const result = await service.handleWebhook('stripe', {
    eventType: 'payment.succeeded',
    providerRef: 'provider-ref-1',
  });

  assert.equal(result.acknowledged, true);
  assert.equal(updatedPayment.paymentId, 'payment-1');
  assert.equal(updatedPayment.data.status, 'SUCCEEDED');
});
