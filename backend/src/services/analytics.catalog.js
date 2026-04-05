const TRACKED_ANALYTICS_EVENTS = {
  upload_initiated: 'uploads',
  upload_completed: 'uploads',
  playback_started: 'playback',
  playback_completed: 'playback',
  playback_session_started: 'playback',
  playback_session_ended: 'playback',
  download_requested: 'downloads',
  download_completed: 'downloads',
  favorite_added: 'favorites',
  favorite_removed: 'favorites',
  playlist_created: 'playlist_actions',
  playlist_renamed: 'playlist_actions',
  playlist_deleted: 'playlist_actions',
  playlist_song_added: 'playlist_actions',
  playlist_song_removed: 'playlist_actions',
  playlist_reordered: 'playlist_actions',
  premium_conversion_started: 'premium_conversions',
  premium_conversion_completed: 'premium_conversions',
  ad_impression: 'ad_engagement',
  ad_click: 'ad_engagement',
  retention_checkin: 'retention',
};

const TRACKED_ANALYTICS_EVENT_NAMES = Object.freeze(Object.keys(TRACKED_ANALYTICS_EVENTS));

function isRetentionEventName(eventName) {
  return typeof eventName === 'string' && eventName.startsWith('retention_');
}

function resolveAnalyticsCategory(eventName, fallback = null) {
  if (TRACKED_ANALYTICS_EVENTS[eventName]) {
    return TRACKED_ANALYTICS_EVENTS[eventName];
  }

  if (isRetentionEventName(eventName)) {
    return 'retention';
  }

  return fallback;
}

function isSupportedAnalyticsEvent(eventName) {
  return Boolean(resolveAnalyticsCategory(eventName));
}

module.exports = {
  TRACKED_ANALYTICS_EVENTS,
  TRACKED_ANALYTICS_EVENT_NAMES,
  resolveAnalyticsCategory,
  isRetentionEventName,
  isSupportedAnalyticsEvent,
};