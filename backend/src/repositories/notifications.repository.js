class NotificationsRepository {
  constructor(prisma) {
    this.prisma = prisma || require('./prismaClient').prisma;
  }

  async ensureUserPreferences(userId) {
    return this.prisma.userPreference.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async getUserPreferences(userId) {
    return this.prisma.userPreference.findUnique({
      where: { userId },
    });
  }

  async updateUserPreferences(userId, updates) {
    return this.prisma.userPreference.upsert({
      where: { userId },
      update: updates,
      create: {
        userId,
        ...updates,
      },
    });
  }

  async listNotifications(userId, options = {}) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(options.channel ? { channel: options.channel } : {}),
        ...(options.status ? { status: options.status } : {}),
        ...(options.includeDismissed ? {} : { status: { not: 'DISMISSED' } }),
      },
      orderBy: [{ createdAt: 'desc' }],
      take: options.limit,
    });
  }

  async countUnreadNotifications(userId) {
    return this.prisma.notification.count({
      where: {
        userId,
        readAt: null,
        status: {
          in: ['QUEUED', 'SENT', 'FAILED'],
        },
      },
    });
  }

  async getNotificationById(userId, notificationId) {
    return this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  async updateNotificationById(userId, notificationId, updates) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: updates,
    });
  }

  async createNotification(data) {
    return this.prisma.notification.create({
      data,
    });
  }

  async createNotificationsBatch(items) {
    if (!items.length) {
      return { count: 0 };
    }

    return this.prisma.notification.createMany({
      data: items,
      skipDuplicates: false,
    });
  }

  async listAudienceUsers(options = {}, now = new Date()) {
    const premiumFilter = {
      subscriptions: {
        some: {
          status: {
            in: ['ACTIVE', 'TRIALING'],
          },
          currentPeriodEnd: {
            gte: now,
          },
          plan: {
            isActive: true,
            code: {
              not: 'FREE',
            },
          },
        },
      },
    };

    const where = {
      status: 'ACTIVE',
      ...(options.marketingOnly
        ? {
            preferences: {
              is: {
                emailMarketingEnabled: true,
              },
            },
          }
        : {}),
      ...(options.audience === 'PREMIUM' ? premiumFilter : {}),
      ...(options.audience === 'FREE'
        ? {
            NOT: premiumFilter,
          }
        : {}),
    };

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        preferences: true,
      },
      take: options.limit,
      orderBy: [{ createdAt: 'desc' }],
    });
  }
}

module.exports = {
  NotificationsRepository,
};