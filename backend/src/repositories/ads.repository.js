class AdsRepository {
  constructor(prisma) {
    this.prisma = prisma || require('./prismaClient').prisma;
  }

  async listActiveCampaigns(now = new Date()) {
    return this.prisma.adCampaign.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: [{ startsAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async listCampaigns(options = {}) {
    return this.prisma.adCampaign.findMany({
      where: {
        ...(options.status ? { status: options.status } : {}),
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async getCampaignById(campaignId) {
    return this.prisma.adCampaign.findUnique({
      where: { id: campaignId },
    });
  }

  async createCampaign(data) {
    return this.prisma.adCampaign.create({
      data,
    });
  }

  async updateCampaignById(campaignId, data) {
    return this.prisma.adCampaign.updateMany({
      where: { id: campaignId },
      data,
    });
  }

  async listActivePromoCodes(now = new Date(), limit = 5) {
    return this.prisma.promoCode.findMany({
      where: {
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }],
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: limit,
    });
  }

  async listAnnouncements(userId, limit = 5) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        type: {
          in: ['ANNOUNCEMENT', 'PROMO_BANNER', 'PROMOTION', 'SYSTEM'],
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: limit,
    });
  }

  async getCurrentSubscription(userId, now = new Date()) {
    return this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING'] },
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
}

module.exports = {
  AdsRepository,
};