const { AnalyticsRepository } = require('../../repositories/analytics.repository');
const { createAnalyticsTracker } = require('../../services/analyticsTracker');
const { TRACKED_ANALYTICS_EVENT_NAMES } = require('../../services/analytics.catalog');
const { AnalyticsError } = require('./analytics.errors');

function toEventDto(event) {
  return {
    id: event.id,
    userId: event.userId,
    deviceSessionId: event.deviceSessionId,
    eventName: event.eventName,
    eventCategory: event.eventCategory,
    source: event.source,
    properties: event.properties || null,
    eventTimestamp: event.eventTimestamp,
    createdAt: event.createdAt,
  };
}

function buildWindow(query) {
  const now = new Date();
  const to = query.to ? new Date(query.to) : now;
  const from = query.from ? new Date(query.from) : new Date(to.getTime() - (query.days || 30) * 24 * 60 * 60 * 1000);
  return { from, to };
}

function toCountMap(rows, key = 'eventName') {
  const map = {};
  for (const row of rows) {
    map[row[key] || 'unknown'] = row._count?._all || 0;
  }
  return map;
}

function sumByNames(countByName, names) {
  return names.reduce((total, name) => total + (countByName[name] || 0), 0);
}

function buildTrackedSummary(countByName) {
  return {
    uploads: {
      initiated: countByName.upload_initiated || 0,
      completed: countByName.upload_completed || 0,
    },
    playback: {
      starts: (countByName.playback_started || 0) + (countByName.playback_session_started || 0),
      completions: (countByName.playback_completed || 0) + (countByName.playback_session_ended || 0),
    },
    downloads: {
      requested: countByName.download_requested || 0,
      completed: countByName.download_completed || 0,
    },
    favorites: {
      added: countByName.favorite_added || 0,
      removed: countByName.favorite_removed || 0,
    },
    playlistActions: {
      total: sumByNames(countByName, [
        'playlist_created',
        'playlist_renamed',
        'playlist_deleted',
        'playlist_song_added',
        'playlist_song_removed',
        'playlist_reordered',
      ]),
    },
    premiumConversions: {
      started: countByName.premium_conversion_started || 0,
      completed: countByName.premium_conversion_completed || 0,
    },
    adEngagement: {
      impressions: countByName.ad_impression || 0,
      clicks: countByName.ad_click || 0,
    },
    retentionEvents: {
      total: Object.entries(countByName)
        .filter(([eventName]) => eventName.startsWith('retention_'))
        .reduce((total, [, count]) => total + count, 0),
    },
  };
}

class AnalyticsService {
  constructor({ analyticsRepository = new AnalyticsRepository(), analyticsTracker = createAnalyticsTracker() } = {}) {
    this.analyticsRepository = analyticsRepository;
    this.analyticsTracker = analyticsTracker;
  }

  async ingestEvent(userId, input) {
    const created = await this.analyticsTracker.trackEventStrict({
      userId,
      deviceSessionId: input.deviceSessionId || null,
      eventName: input.eventName,
      source: input.source,
      properties: input.properties || null,
      eventTimestamp: input.eventTimestamp ? new Date(input.eventTimestamp) : new Date(),
    });

    return {
      accepted: true,
      event: toEventDto(created),
    };
  }

  async ingestEventsBatch(userId, input) {
    const result = await this.analyticsTracker.trackEventsStrict(
      input.events.map((event) => ({
        userId,
        deviceSessionId: event.deviceSessionId || null,
        eventName: event.eventName,
        source: event.source,
        properties: event.properties || null,
        eventTimestamp: event.eventTimestamp ? new Date(event.eventTimestamp) : new Date(),
      }))
    );

    return {
      acceptedCount: result.count || 0,
      requestedCount: input.events.length,
    };
  }

  async getUserSummary(userId, query) {
    const window = buildWindow(query);
    const where = {
      userId,
      eventTimestamp: {
        gte: window.from,
        lte: window.to,
      },
    };

    const [totalEvents, groupedByName, groupedByCategory] = await Promise.all([
      this.analyticsRepository.countEvents(where),
      this.analyticsRepository.groupEventsByName(where),
      this.analyticsRepository.groupEventsByCategory(where),
    ]);

    const countByName = toCountMap(groupedByName, 'eventName');

    return {
      window,
      totalEvents,
      byCategory: toCountMap(groupedByCategory, 'eventCategory'),
      byEvent: countByName,
      tracked: buildTrackedSummary(countByName),
    };
  }

  async getAdminOverview(query) {
    const window = buildWindow(query);
    const where = {
      eventTimestamp: {
        gte: window.from,
        lte: window.to,
      },
      ...(query.source ? { source: query.source } : {}),
    };

    const [totalEvents, groupedByName, groupedByCategory, groupedBySource, groupedUsers] = await Promise.all([
      this.analyticsRepository.countEvents(where),
      this.analyticsRepository.groupEventsByName(where),
      this.analyticsRepository.groupEventsByCategory(where),
      this.analyticsRepository.groupEventsBySource(where),
      this.analyticsRepository.groupUsers({
        ...where,
        userId: {
          not: null,
        },
      }),
    ]);

    const countByName = toCountMap(groupedByName, 'eventName');
    const tracked = buildTrackedSummary(countByName);
    const premiumStarted = tracked.premiumConversions.started;
    const premiumCompleted = tracked.premiumConversions.completed;
    const adImpressions = tracked.adEngagement.impressions;
    const adClicks = tracked.adEngagement.clicks;

    return {
      window,
      generatedAt: new Date(),
      totalEvents,
      activeUsers: groupedUsers.length,
      bySource: toCountMap(groupedBySource, 'source'),
      byCategory: toCountMap(groupedByCategory, 'eventCategory'),
      byEvent: countByName,
      tracked,
      derivedMetrics: {
        premiumConversionRate: premiumStarted > 0 ? premiumCompleted / premiumStarted : 0,
        adClickThroughRate: adImpressions > 0 ? adClicks / adImpressions : 0,
      },
      coverage: {
        supportedEvents: TRACKED_ANALYTICS_EVENT_NAMES,
      },
    };
  }

  async getAdminEventsReport(query) {
    const window = buildWindow(query);
    const page = query.page || 1;
    const pageSize = query.pageSize || 50;
    if ((page - 1) * pageSize > 50_000) {
      throw new AnalyticsError(400, 'PAGINATION_WINDOW_EXCEEDED', 'Requested page is too deep. Narrow filters or lower page number.');
    }
    const where = {
      eventTimestamp: {
        gte: window.from,
        lte: window.to,
      },
      ...(query.source ? { source: query.source } : {}),
      ...(query.category ? { eventCategory: query.category } : {}),
      ...(query.eventName ? { eventName: query.eventName } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
    };

    const [total, rows] = await Promise.all([
      this.analyticsRepository.countEvents(where),
      this.analyticsRepository.listEvents(where, {
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data: rows.map(toEventDto),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      window,
    };
  }
}

function createAnalyticsService(dependencies) {
  return new AnalyticsService(dependencies);
}

module.exports = {
  AnalyticsService,
  createAnalyticsService,
};