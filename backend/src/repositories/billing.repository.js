class BillingRepository {
  constructor(prisma) {
    this.prisma = prisma || require('./prismaClient').prisma;
  }

  async listPlans(options = {}) {
    return this.prisma.plan.findMany({
      where: options.activeOnly ? { isActive: true } : undefined,
      orderBy: [{ priceCents: 'asc' }, { code: 'asc' }],
    });
  }

  async getPlanByCode(code) {
    return this.prisma.plan.findUnique({
      where: { code },
    });
  }

  async getCurrentSubscription(userId, now = new Date()) {
    return this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
        currentPeriodEnd: { gte: now },
      },
      include: {
        plan: {
          select: {
            id: true,
            code: true,
            name: true,
            interval: true,
            priceCents: true,
            currency: true,
            isActive: true,
          },
        },
      },
      orderBy: { currentPeriodEnd: 'desc' },
    });
  }

  async listSubscriptions(userId) {
    return this.prisma.subscription.findMany({
      where: { userId },
      include: {
        plan: {
          select: {
            id: true,
            code: true,
            name: true,
            interval: true,
            priceCents: true,
            currency: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSubscription(data) {
    return this.prisma.subscription.create({
      data,
      include: {
        plan: true,
      },
    });
  }

  async updateSubscriptionById(userId, subscriptionId, data) {
    return this.prisma.subscription.updateMany({
      where: {
        id: subscriptionId,
        userId,
      },
      data,
    });
  }

  async listPayments(userId) {
    return this.prisma.payment.findMany({
      where: { userId },
      include: {
        plan: {
          select: {
            id: true,
            code: true,
            name: true,
            interval: true,
            priceCents: true,
            currency: true,
            isActive: true,
          },
        },
        promoCode: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPayment(data) {
    return this.prisma.payment.create({
      data,
      include: {
        plan: true,
        promoCode: true,
      },
    });
  }

  async updatePaymentById(paymentId, data) {
    return this.prisma.payment.updateMany({
      where: { id: paymentId },
      data,
    });
  }

  async findPaymentByProviderRef(provider, providerRef) {
    return this.prisma.payment.findFirst({
      where: {
        provider,
        providerRef,
      },
      include: {
        plan: true,
        promoCode: true,
      },
    });
  }

  async getPromoCodeByCode(code) {
    return this.prisma.promoCode.findUnique({
      where: { code },
    });
  }

  async incrementPromoCodeRedemptionCount(promoCodeId) {
    return this.prisma.promoCode.update({
      where: { id: promoCodeId },
      data: {
        redeemedCount: {
          increment: 1,
        },
      },
    });
  }

  async updatePromoCodeById(promoCodeId, data) {
    return this.prisma.promoCode.update({
      where: { id: promoCodeId },
      data,
    });
  }
}

module.exports = {
  BillingRepository,
};