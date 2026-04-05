class AnalyticsRepository {
  constructor(prisma) {
    this.prisma = prisma || null;
  }

  getPrisma() {
    if (!this.prisma) {
      this.prisma = require('./prismaClient').prisma;
    }

    return this.prisma;
  }

  async createEvent(data) {
    return this.getPrisma().analyticsEvent.create({
      data,
    });
  }

  async createEventsBatch(items) {
    if (!items.length) {
      return { count: 0 };
    }

    return this.getPrisma().analyticsEvent.createMany({
      data: items,
      skipDuplicates: false,
    });
  }

  async countEvents(where) {
    return this.getPrisma().analyticsEvent.count({ where });
  }

  async groupEventsByName(where) {
    return this.getPrisma().analyticsEvent.groupBy({
      by: ['eventName'],
      where,
      _count: { _all: true },
    });
  }

  async groupEventsByCategory(where) {
    return this.getPrisma().analyticsEvent.groupBy({
      by: ['eventCategory'],
      where,
      _count: { _all: true },
    });
  }

  async groupEventsBySource(where) {
    return this.getPrisma().analyticsEvent.groupBy({
      by: ['source'],
      where,
      _count: { _all: true },
    });
  }

  async groupUsers(where) {
    return this.getPrisma().analyticsEvent.groupBy({
      by: ['userId'],
      where,
      _count: { _all: true },
    });
  }

  async listEvents(where, options = {}) {
    return this.getPrisma().analyticsEvent.findMany({
      where,
      orderBy: [{ eventTimestamp: 'desc' }, { createdAt: 'desc' }],
      skip: options.skip,
      take: options.take,
    });
  }
}

module.exports = {
  AnalyticsRepository,
};