const { getEnv } = require('../../config/env');
const { BillingRepository } = require('../../repositories/billing.repository');
const {
  PLAN_CATALOG,
  buildEntitlementProfile,
  buildPlanComparison,
  normalizePlanCode,
  resolvePlanTier,
} = require('../../services/entitlements');
const { createAnalyticsTracker } = require('../../services/analyticsTracker');
const { BillingError } = require('./billing.errors');

function toPlanDto(plan) {
  const tier = resolvePlanTier({
    status: 'ACTIVE',
    plan: {
      code: plan.code,
      isActive: plan.isActive !== false,
    },
  });

  const profile = buildEntitlementProfile({
    status: 'ACTIVE',
    plan: {
      code: plan.code,
      isActive: plan.isActive !== false,
    },
  });

  return {
    id: plan.id || null,
    code: plan.code,
    name: plan.name,
    description: plan.description || null,
    interval: plan.interval,
    priceCents: plan.priceCents,
    currency: plan.currency,
    isActive: plan.isActive !== false,
    badge: plan.badge || null,
    tier,
    featureSummary: profile,
  };
}

function toSubscriptionDto(subscription) {
  if (!subscription) {
    return null;
  }

  return {
    id: subscription.id,
    userId: subscription.userId,
    planId: subscription.planId,
    status: subscription.status,
    startsAt: subscription.startsAt,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAt: subscription.cancelAt,
    endedAt: subscription.endedAt,
    externalRef: subscription.externalRef,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
    plan: subscription.plan ? toPlanDto(subscription.plan) : null,
  };
}

function toPaymentDto(payment) {
  if (!payment) {
    return null;
  }

  return {
    id: payment.id,
    userId: payment.userId,
    subscriptionId: payment.subscriptionId,
    planId: payment.planId,
    promoCodeId: payment.promoCodeId,
    amountCents: payment.amountCents,
    currency: payment.currency,
    provider: payment.provider,
    providerRef: payment.providerRef,
    status: payment.status,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    plan: payment.plan ? toPlanDto(payment.plan) : null,
    promoCode: payment.promoCode || null,
  };
}

class BillingService {
  constructor({ billingRepository = new BillingRepository(), analyticsTracker = createAnalyticsTracker(), env = getEnv() } = {}) {
    this.billingRepository = billingRepository;
    this.analyticsTracker = analyticsTracker;
    this.env = env;
  }

  async listPlans(options = {}) {
    const plans = await this.billingRepository.listPlans({ activeOnly: !options.includeInactive });
    const sourcePlans = plans.length ? plans : PLAN_CATALOG;
    return sourcePlans.map(toPlanDto);
  }

  async getFeatureComparison(options = {}) {
    const plans = await this.listPlans({ includeInactive: options.includeInactive });
    return buildPlanComparison(plans);
  }

  async getSubscriptionStatus(userId) {
    const subscription = await this.billingRepository.getCurrentSubscription(userId);
    const entitlements = buildEntitlementProfile(subscription);
    const plans = await this.listPlans();
    const defaultPlan = plans.find((plan) => plan.code === this.env.subscriptions.defaultPlanCode) || plans[0] || null;

    return {
      subscription: toSubscriptionDto(subscription),
      plan: subscription?.plan ? toPlanDto(subscription.plan) : defaultPlan,
      entitlements,
      paymentIntegration: this.getPaymentConfig(),
    };
  }

  async getUpsellData(userId) {
    const status = await this.getSubscriptionStatus(userId);
    const comparison = await this.getFeatureComparison();
    const premiumPlan = comparison.plans.find((plan) => plan.tier === 'PREMIUM' && plan.isActive);

    if (status.entitlements.isPremium) {
      return {
        hero: {
          title: 'Premium is active',
          subtitle: 'You already have ad-free playback, larger storage, and offline access.',
          ctaLabel: 'Manage subscription',
        },
        status,
        comparison,
        featuredPlan: premiumPlan || null,
      };
    }

    return {
      hero: {
        title: 'Upgrade to Premium',
        subtitle: 'Remove ads, unlock higher audio quality, and expand your offline library.',
        ctaLabel: 'Start Premium',
      },
      status,
      comparison,
      featuredPlan: premiumPlan || null,
    };
  }

  async getEntitlements(userId) {
    const status = await this.getSubscriptionStatus(userId);
    return {
      subscription: status.subscription,
      plan: status.plan,
      entitlements: status.entitlements,
      features: {
        adFree: status.entitlements.adFree,
        storageLimitBytes: status.entitlements.storageLimitBytes,
        offlineDownloadLimit: status.entitlements.offlineDownloadLimit,
        maxAudioQuality: status.entitlements.maxAudioQuality,
      },
    };
  }

  getPaymentConfig() {
    return {
      enabled: this.env.subscriptions.enabled,
      provider: this.env.subscriptions.provider,
      defaultPlanCode: this.env.subscriptions.defaultPlanCode,
      trialDays: this.env.subscriptions.trialDays,
      requiresWebhookSecret: Boolean(this.env.subscriptions.webhookSecret),
      publicKeyConfigured: false,
    };
  }

  async validatePromoCode(input) {
    const promoCode = await this.billingRepository.getPromoCodeByCode(input.code.trim().toUpperCase());
    if (!promoCode) {
      return {
        valid: false,
        reason: 'NOT_FOUND',
      };
    }

    const now = new Date();
    const exhausted = promoCode.maxRedemptions !== null && promoCode.maxRedemptions !== undefined
      ? promoCode.redeemedCount >= promoCode.maxRedemptions
      : false;
    const active = promoCode.isActive && (!promoCode.startsAt || promoCode.startsAt <= now) && (!promoCode.expiresAt || promoCode.expiresAt >= now);

    if (!active) {
      return {
        valid: false,
        reason: 'INACTIVE',
        promoCode: this.toPromoCodeDto(promoCode),
      };
    }

    if (exhausted) {
      return {
        valid: false,
        reason: 'MAX_REDEMPTIONS_REACHED',
        promoCode: this.toPromoCodeDto(promoCode),
      };
    }

    return {
      valid: true,
      reason: 'VALID',
      promoCode: this.toPromoCodeDto(promoCode),
      discount: this.calculateDiscountPreview(promoCode, input.amountCents),
    };
  }

  async redeemPromoCode(userId, input) {
    const validation = await this.validatePromoCode(input);
    if (!validation.valid) {
      throw new BillingError(400, 'PROMO_CODE_INVALID', 'Promo code is not valid.', validation);
    }

    await this.billingRepository.incrementPromoCodeRedemptionCount(validation.promoCode.id);

    return {
      userId,
      promoCode: validation.promoCode,
      discount: validation.discount,
      redeemed: true,
    };
  }

  async createCheckoutSession(userId, input) {
    const plan = await this.resolvePlanByCode(input.planCode);
    if (!plan) {
      throw new BillingError(404, 'PLAN_NOT_FOUND', 'Requested plan was not found or is inactive.');
    }

    const validation = input.promoCode ? await this.validatePromoCode({ code: input.promoCode, amountCents: plan.priceCents }) : null;
    if (input.promoCode && (!validation || !validation.valid)) {
      throw new BillingError(400, 'PROMO_CODE_INVALID', 'Promo code is not valid.', validation || undefined);
    }

    const discount = validation?.valid ? validation.discount : null;
    const discountCents = discount?.discountCents || 0;
    const finalAmountCents = Math.max(0, plan.priceCents - discountCents);
    const provider = this.env.subscriptions.provider;
    const payment = await this.billingRepository.createPayment({
      userId,
      subscriptionId: null,
      planId: plan.id,
      promoCodeId: validation?.promoCode?.id || null,
      amountCents: finalAmountCents,
      currency: plan.currency,
      provider,
      providerRef: null,
      status: 'PENDING',
      paidAt: null,
    });

    await this.analyticsTracker.trackEvent({
      userId,
      eventName: 'premium_conversion_started',
      properties: {
        paymentId: payment.id,
        planCode: plan.code,
        provider,
        amountCents: finalAmountCents,
        discounted: Boolean(discount),
      },
    });

    return {
      payment: toPaymentDto(payment),
      plan,
      promoCode: validation?.promoCode || null,
      discount,
      integration: {
        provider,
        enabled: this.env.subscriptions.enabled,
        state: provider === 'none' ? 'NOT_CONFIGURED' : 'READY',
        publicKeyConfigured: false,
        webhookSecretConfigured: Boolean(this.env.subscriptions.webhookSecret),
      },
    };
  }

  async handleWebhook(provider, payload) {
    const configuredProvider = this.env.subscriptions.provider;
    if (configuredProvider !== 'none' && provider !== configuredProvider && configuredProvider !== 'custom') {
      throw new BillingError(400, 'PROVIDER_MISMATCH', 'Webhook provider does not match the configured payment provider.');
    }

    const eventType = payload.eventType || payload.type || 'unknown';
    const providerRef = payload.providerRef || payload.paymentProviderRef || null;
    let action = 'IGNORED';

    if (providerRef && ['payment.succeeded', 'invoice.paid', 'checkout.session.completed'].includes(eventType)) {
      const payment = await this.billingRepository.findPaymentByProviderRef(provider, providerRef);
      if (payment) {
        await this.billingRepository.updatePaymentById(payment.id, {
          status: 'SUCCEEDED',
          paidAt: new Date(),
        });
        await this.analyticsTracker.trackEvent({
          userId: payment.userId,
          eventName: 'premium_conversion_completed',
          source: 'BACKEND',
          properties: {
            provider,
            providerRef,
            paymentId: payment.id,
            eventType,
          },
        });
        action = 'PAYMENT_MARKED_SUCCEEDED';
      }
    }

    if (payload.subscriptionId && payload.userId && ['subscription.active', 'subscription.renewed', 'customer.subscription.updated'].includes(eventType)) {
      await this.billingRepository.updateSubscriptionById(payload.userId, payload.subscriptionId, {
        status: 'ACTIVE',
      });
      action = 'SUBSCRIPTION_MARKED_ACTIVE';
    }

    return {
      acknowledged: true,
      provider,
      eventType,
      action,
    };
  }

  async resolvePlanByCode(planCode) {
    const normalized = normalizePlanCode(planCode);
    const plan = await this.billingRepository.getPlanByCode(normalized);
    if (plan && plan.isActive) {
      return toPlanDto(plan);
    }

    const fallback = PLAN_CATALOG.find((entry) => entry.code === normalized && entry.isActive);
    if (fallback) {
      return toPlanDto(fallback);
    }

    return null;
  }

  calculateDiscountPreview(promoCode, amountCents = 0) {
    const amount = Number.isFinite(Number(amountCents)) ? Number(amountCents) : 0;
    const discountValue = Number(promoCode.discountValue || 0);
    let discountCents = 0;

    if (promoCode.discountType === 'PERCENT') {
      discountCents = Math.round((amount * discountValue) / 100);
    } else {
      discountCents = Math.round(discountValue);
    }

    return {
      discountType: promoCode.discountType,
      discountValue,
      discountCents: Math.min(amount, Math.max(0, discountCents)),
      finalAmountCents: Math.max(0, amount - Math.min(amount, Math.max(0, discountCents))),
    };
  }

  toPromoCodeDto(promoCode) {
    return {
      id: promoCode.id,
      code: promoCode.code,
      description: promoCode.description || null,
      discountType: promoCode.discountType,
      discountValue: Number(promoCode.discountValue),
      maxRedemptions: promoCode.maxRedemptions,
      redeemedCount: promoCode.redeemedCount,
      startsAt: promoCode.startsAt,
      expiresAt: promoCode.expiresAt,
      isActive: promoCode.isActive,
    };
  }
}

function createBillingService(dependencies) {
  return new BillingService(dependencies);
}

module.exports = {
  BillingService,
  createBillingService,
};