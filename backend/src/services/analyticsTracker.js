const { AnalyticsRepository } = require('../repositories/analytics.repository');
const { resolveAnalyticsCategory } = require('./analytics.catalog');

class AnalyticsTracker {
  constructor({ analyticsRepository = new AnalyticsRepository(), defaultSource = 'BACKEND' } = {}) {
    this.analyticsRepository = analyticsRepository;
    this.defaultSource = defaultSource;
  }

  normalizeEvent(input) {
    const category = resolveAnalyticsCategory(input.eventName, input.eventCategory || 'custom');

    return {
      userId: input.userId || null,
      deviceSessionId: input.deviceSessionId || null,
      eventName: input.eventName,
      eventCategory: category,
      source: input.source || this.defaultSource,
      properties: input.properties || null,
      eventTimestamp: input.eventTimestamp || new Date(),
    };
  }

  async trackEventStrict(input) {
    if (!input || !input.eventName) {
      return null;
    }

    return this.analyticsRepository.createEvent(this.normalizeEvent(input));
  }

  async trackEventsStrict(inputs) {
    if (!Array.isArray(inputs) || !inputs.length) {
      return { count: 0 };
    }

    const rows = inputs.filter((item) => item && item.eventName).map((item) => this.normalizeEvent(item));
    return this.analyticsRepository.createEventsBatch(rows);
  }

  async trackEvent(input) {
    if (!input || !input.eventName) {
      return null;
    }

    try {
      return await this.analyticsRepository.createEvent(this.normalizeEvent(input));
    } catch (_error) {
      return null;
    }
  }

  async trackEvents(inputs) {
    if (!Array.isArray(inputs) || !inputs.length) {
      return { count: 0 };
    }

    try {
      const rows = inputs.filter((item) => item && item.eventName).map((item) => this.normalizeEvent(item));
      return await this.analyticsRepository.createEventsBatch(rows);
    } catch (_error) {
      return { count: 0 };
    }
  }
}

function createAnalyticsTracker(dependencies) {
  return new AnalyticsTracker(dependencies);
}

module.exports = {
  AnalyticsTracker,
  createAnalyticsTracker,
};