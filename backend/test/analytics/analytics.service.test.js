const test = require('node:test');
const assert = require('node:assert/strict');

const { AnalyticsService } = require('../../src/modules/analytics/analytics.service');
const { AnalyticsError } = require('../../src/modules/analytics/analytics.errors');

function createRepositoryDouble(overrides = {}) {
  return {
    countEvents: async () => 6,
    groupEventsByName: async () => [
      { eventName: 'upload_initiated', _count: { _all: 1 } },
      { eventName: 'upload_completed', _count: { _all: 1 } },
      { eventName: 'playback_session_started', _count: { _all: 2 } },
      { eventName: 'playback_session_ended', _count: { _all: 1 } },
      { eventName: 'ad_impression', _count: { _all: 1 } },
    ],
    groupEventsByCategory: async () => [
      { eventCategory: 'uploads', _count: { _all: 2 } },
      { eventCategory: 'playback', _count: { _all: 3 } },
      { eventCategory: 'ad_engagement', _count: { _all: 1 } },
    ],
    groupEventsBySource: async () => [
      { source: 'BACKEND', _count: { _all: 5 } },
      { source: 'MOBILE', _count: { _all: 1 } },
    ],
    groupUsers: async () => [{ userId: 'u-1', _count: { _all: 2 } }, { userId: 'u-2', _count: { _all: 1 } }],
    listEvents: async () => [
      {
        id: 'e-1',
        userId: 'u-1',
        deviceSessionId: null,
        eventName: 'upload_completed',
        eventCategory: 'uploads',
        source: 'BACKEND',
        properties: { uploadId: 'up-1' },
        eventTimestamp: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ],
    ...overrides,
  };
}

function createTrackerDouble(overrides = {}) {
  return {
    trackEvent: async (payload) => ({
      id: 'e-new',
      userId: payload.userId,
      deviceSessionId: payload.deviceSessionId || null,
      eventName: payload.eventName,
      eventCategory: 'retention',
      source: payload.source || 'MOBILE',
      properties: payload.properties || null,
      eventTimestamp: payload.eventTimestamp || new Date(),
      createdAt: new Date(),
    }),
    trackEvents: async (events) => ({ count: events.length }),
    trackEventStrict: async (payload) => ({
      id: 'e-new',
      userId: payload.userId,
      deviceSessionId: payload.deviceSessionId || null,
      eventName: payload.eventName,
      eventCategory: 'retention',
      source: payload.source || 'MOBILE',
      properties: payload.properties || null,
      eventTimestamp: payload.eventTimestamp || new Date(),
      createdAt: new Date(),
    }),
    trackEventsStrict: async (events) => ({ count: events.length }),
    ...overrides,
  };
}

test('ingestEvent accepts and returns tracked event payload', async () => {
  const service = new AnalyticsService({
    analyticsRepository: createRepositoryDouble(),
    analyticsTracker: createTrackerDouble(),
  });

  const result = await service.ingestEvent('u-1', {
    eventName: 'retention_checkin',
    source: 'MOBILE',
    properties: { day: 7 },
  });

  assert.equal(result.accepted, true);
  assert.equal(result.event.eventName, 'retention_checkin');
});

test('getUserSummary returns tracked aggregate structure', async () => {
  const service = new AnalyticsService({
    analyticsRepository: createRepositoryDouble(),
    analyticsTracker: createTrackerDouble(),
  });

  const summary = await service.getUserSummary('u-1', { days: 30 });
  assert.equal(summary.totalEvents, 6);
  assert.equal(summary.tracked.uploads.completed, 1);
  assert.equal(summary.tracked.playback.starts, 2);
});

test('getAdminOverview returns derived conversion and CTR metrics', async () => {
  const service = new AnalyticsService({
    analyticsRepository: createRepositoryDouble({
      groupEventsByName: async () => [
        { eventName: 'premium_conversion_started', _count: { _all: 4 } },
        { eventName: 'premium_conversion_completed', _count: { _all: 2 } },
        { eventName: 'ad_impression', _count: { _all: 20 } },
        { eventName: 'ad_click', _count: { _all: 5 } },
      ],
    }),
    analyticsTracker: createTrackerDouble(),
  });

  const overview = await service.getAdminOverview({ days: 14 });
  assert.equal(overview.derivedMetrics.premiumConversionRate, 0.5);
  assert.equal(overview.derivedMetrics.adClickThroughRate, 0.25);
});

test('getAdminEventsReport returns paginated events', async () => {
  const service = new AnalyticsService({
    analyticsRepository: createRepositoryDouble(),
    analyticsTracker: createTrackerDouble(),
  });

  const report = await service.getAdminEventsReport({ days: 7, page: 1, pageSize: 10 });
  assert.equal(report.pagination.total, 6);
  assert.equal(report.data.length, 1);
});

test('ingestEvent propagates persistence failures instead of returning false success', async () => {
  const service = new AnalyticsService({
    analyticsRepository: createRepositoryDouble(),
    analyticsTracker: createTrackerDouble({
      trackEventStrict: async () => {
        throw new Error('db unavailable');
      },
    }),
  });

  await assert.rejects(
    () =>
      service.ingestEvent('u-1', {
        eventName: 'retention_checkin',
        source: 'MOBILE',
      }),
    /db unavailable/
  );
});

test('getAdminEventsReport rejects very deep pagination window', async () => {
  const service = new AnalyticsService({
    analyticsRepository: createRepositoryDouble(),
    analyticsTracker: createTrackerDouble(),
  });

  await assert.rejects(
    () => service.getAdminEventsReport({ days: 7, page: 2000, pageSize: 100 }),
    (error) => error instanceof AnalyticsError && error.code === 'PAGINATION_WINDOW_EXCEEDED'
  );
});