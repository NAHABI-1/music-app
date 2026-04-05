require('dotenv').config();

const { appEnvSchema } = require('./env.schema');

let cachedEnv = null;

const SECRET_KEYS = [
  'auth.jwtSecret',
  'auth.refreshTokenSecret',
  'storage.accessKey',
  'storage.secretKey',
  'notifications.apiKey',
  'subscriptions.webhookSecret',
  'analytics.writeKey',
  'database.url',
];

function splitCsv(value, fallback) {
  const source = value || fallback || '';
  return source
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeEnvironment(rawEnv) {
  return {
    nodeEnv: rawEnv.NODE_ENV || 'development',
    appEnv: rawEnv.APP_ENV || rawEnv.NODE_ENV || 'development',
    appName: rawEnv.APP_NAME || 'CloudTune API',
    host: rawEnv.HOST || rawEnv.BACKEND_HOST || '0.0.0.0',
    port: rawEnv.PORT || rawEnv.BACKEND_PORT || '4000',
    appVersion: rawEnv.APP_VERSION || '0.1.0',
    allowedOrigins: splitCsv(rawEnv.APP_ALLOWED_ORIGINS, ''),

    jwtSecret: rawEnv.JWT_SECRET || '',
    jwtExpiresIn: rawEnv.JWT_EXPIRES_IN || '7d',
    refreshTokenSecret: rawEnv.REFRESH_TOKEN_SECRET || rawEnv.JWT_SECRET || '',
    refreshTokenExpiresIn: rawEnv.REFRESH_TOKEN_EXPIRES_IN || '30d',
    authPasswordHashRounds: rawEnv.AUTH_PASSWORD_HASH_ROUNDS || '12',
    authSocialGoogleEnabled: rawEnv.AUTH_SOCIAL_GOOGLE_ENABLED || 'false',
    authSocialGoogleClientId: rawEnv.AUTH_SOCIAL_GOOGLE_CLIENT_ID || '',
    authSocialAppleEnabled: rawEnv.AUTH_SOCIAL_APPLE_ENABLED || 'false',
    authSocialAppleServiceId: rawEnv.AUTH_SOCIAL_APPLE_SERVICE_ID || '',

    databaseUrl: rawEnv.DATABASE_URL || '',
    dbPoolMin: rawEnv.DB_POOL_MIN || '1',
    dbPoolMax: rawEnv.DB_POOL_MAX || '10',
    dbStatementTimeoutMs: rawEnv.DB_STATEMENT_TIMEOUT_MS || '12000',

    storageProvider: rawEnv.STORAGE_PROVIDER || 'minio',
    storageEndpoint: rawEnv.STORAGE_ENDPOINT || rawEnv.MINIO_ENDPOINT || 'localhost',
    storagePort: rawEnv.STORAGE_PORT || rawEnv.MINIO_PORT || '9000',
    storageUseSsl: rawEnv.STORAGE_USE_SSL || 'false',
    storageAccessKey: rawEnv.STORAGE_ACCESS_KEY || rawEnv.MINIO_ACCESS_KEY || '',
    storageSecretKey: rawEnv.STORAGE_SECRET_KEY || rawEnv.MINIO_SECRET_KEY || '',
    storageBucket: rawEnv.STORAGE_BUCKET || rawEnv.MINIO_BUCKET || 'cloudtune-media',
    storageRegion: rawEnv.STORAGE_REGION || 'us-east-1',
    storageSignedUrlTtlSeconds: rawEnv.STORAGE_SIGNED_URL_TTL_SECONDS || '900',

    audioMaxUploadMb: rawEnv.AUDIO_MAX_UPLOAD_MB || '250',
    audioAllowedMimeTypes: splitCsv(
      rawEnv.AUDIO_ALLOWED_MIME_TYPES,
      'audio/mpeg,audio/flac,audio/wav,audio/x-wav,audio/aac,audio/mp4'
    ),
    audioWaveformEnabled: rawEnv.AUDIO_WAVEFORM_ENABLED || 'true',
    audioOfflineTtlHours: rawEnv.AUDIO_OFFLINE_TTL_HOURS || '720',
    playbackSignedUrlTtlSeconds: rawEnv.PLAYBACK_SIGNED_URL_TTL_SECONDS || rawEnv.STORAGE_SIGNED_URL_TTL_SECONDS || '900',

    notificationsPushEnabled: rawEnv.NOTIFICATIONS_PUSH_ENABLED || 'true',
    notificationsEmailEnabled: rawEnv.NOTIFICATIONS_EMAIL_ENABLED || 'true',
    notificationsProvider: rawEnv.NOTIFICATIONS_PROVIDER || 'none',
    notificationsApiKey: rawEnv.NOTIFICATIONS_API_KEY || '',
    notificationsFromEmail: rawEnv.NOTIFICATIONS_FROM_EMAIL || 'noreply@cloudtune.local',

    adsEnabled: rawEnv.ADS_ENABLED || 'false',
    adsProvider: rawEnv.ADS_PROVIDER || 'none',
    adsAppId: rawEnv.ADS_APP_ID || '',
    adsBannerUnitId: rawEnv.ADS_BANNER_UNIT_ID || '',
    adsInterstitialUnitId: rawEnv.ADS_INTERSTITIAL_UNIT_ID || '',
    adsRewardedUnitId: rawEnv.ADS_REWARDED_UNIT_ID || '',

    subscriptionsEnabled: rawEnv.SUBSCRIPTIONS_ENABLED || 'true',
    subscriptionsProvider: rawEnv.SUBSCRIPTIONS_PROVIDER || 'none',
    subscriptionsWebhookSecret: rawEnv.SUBSCRIPTIONS_WEBHOOK_SECRET || '',
    subscriptionsDefaultPlanCode: rawEnv.SUBSCRIPTIONS_DEFAULT_PLAN_CODE || 'FREE',
    subscriptionsTrialDays: rawEnv.SUBSCRIPTIONS_TRIAL_DAYS || '14',

    analyticsEnabled: rawEnv.ANALYTICS_ENABLED || 'true',
    analyticsProvider: rawEnv.ANALYTICS_PROVIDER || 'none',
    analyticsWriteKey: rawEnv.ANALYTICS_WRITE_KEY || '',
    analyticsSampleRate: rawEnv.ANALYTICS_SAMPLE_RATE || '1',
  };
}

function parseEnvironment(rawEnv = process.env) {
  const normalized = normalizeEnvironment(rawEnv);
  const parsed = appEnvSchema.safeParse(normalized);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  const v = parsed.data;

  return {
    app: {
      name: v.appName,
      env: v.appEnv,
      nodeEnv: v.nodeEnv,
      host: v.host,
      port: v.port,
      version: v.appVersion,
      allowedOrigins: v.allowedOrigins,
    },
    auth: {
      jwtSecret: v.jwtSecret,
      jwtExpiresIn: v.jwtExpiresIn,
      refreshTokenSecret: v.refreshTokenSecret,
      refreshTokenExpiresIn: v.refreshTokenExpiresIn,
      passwordHashRounds: v.authPasswordHashRounds,
      social: {
        google: {
          enabled: v.authSocialGoogleEnabled,
          clientId: v.authSocialGoogleClientId,
        },
        apple: {
          enabled: v.authSocialAppleEnabled,
          serviceId: v.authSocialAppleServiceId,
        },
      },
    },
    database: {
      url: v.databaseUrl,
      poolMin: v.dbPoolMin,
      poolMax: v.dbPoolMax,
      statementTimeoutMs: v.dbStatementTimeoutMs,
    },
    storage: {
      provider: v.storageProvider,
      endpoint: v.storageEndpoint,
      port: v.storagePort,
      useSsl: v.storageUseSsl,
      accessKey: v.storageAccessKey,
      secretKey: v.storageSecretKey,
      bucket: v.storageBucket,
      region: v.storageRegion,
      signedUrlTtlSeconds: v.storageSignedUrlTtlSeconds,
    },
    audio: {
      maxUploadMb: v.audioMaxUploadMb,
      allowedMimeTypes: v.audioAllowedMimeTypes,
      waveformEnabled: v.audioWaveformEnabled,
      offlineTtlHours: v.audioOfflineTtlHours,
    },
    playback: {
      signedUrlTtlSeconds: v.playbackSignedUrlTtlSeconds,
    },
    notifications: {
      pushEnabled: v.notificationsPushEnabled,
      emailEnabled: v.notificationsEmailEnabled,
      provider: v.notificationsProvider,
      apiKey: v.notificationsApiKey,
      fromEmail: v.notificationsFromEmail,
    },
    ads: {
      enabled: v.adsEnabled,
      provider: v.adsProvider,
      appId: v.adsAppId,
      bannerUnitId: v.adsBannerUnitId,
      interstitialUnitId: v.adsInterstitialUnitId,
      rewardedUnitId: v.adsRewardedUnitId,
    },
    subscriptions: {
      enabled: v.subscriptionsEnabled,
      provider: v.subscriptionsProvider,
      webhookSecret: v.subscriptionsWebhookSecret,
      defaultPlanCode: v.subscriptionsDefaultPlanCode,
      trialDays: v.subscriptionsTrialDays,
    },
    analytics: {
      enabled: v.analyticsEnabled,
      provider: v.analyticsProvider,
      writeKey: v.analyticsWriteKey,
      sampleRate: v.analyticsSampleRate,
    },
  };
}

function redactValue(value) {
  if (value === null || value === undefined || value === '') {
    return value;
  }
  return '[REDACTED]';
}

function createRedactedConfig(config) {
  const clone = JSON.parse(JSON.stringify(config));

  SECRET_KEYS.forEach((path) => {
    const keys = path.split('.');
    let cursor = clone;
    for (let i = 0; i < keys.length - 1; i += 1) {
      cursor = cursor[keys[i]];
      if (!cursor) {
        return;
      }
    }
    const last = keys[keys.length - 1];
    if (Object.prototype.hasOwnProperty.call(cursor, last)) {
      cursor[last] = redactValue(cursor[last]);
    }
  });

  return clone;
}

function createPublicConfig(config) {
  return {
    app: {
      name: config.app.name,
      env: config.app.env,
      version: config.app.version,
      allowedOrigins: config.app.allowedOrigins,
    },
    audio: {
      maxUploadMb: config.audio.maxUploadMb,
      allowedMimeTypes: config.audio.allowedMimeTypes,
      waveformEnabled: config.audio.waveformEnabled,
      offlineTtlHours: config.audio.offlineTtlHours,
    },
    playback: {
      signedUrlTtlSeconds: config.playback.signedUrlTtlSeconds,
    },
    notifications: {
      pushEnabled: config.notifications.pushEnabled,
      emailEnabled: config.notifications.emailEnabled,
      provider: config.notifications.provider,
      fromEmail: config.notifications.fromEmail,
    },
    ads: {
      enabled: config.ads.enabled,
      provider: config.ads.provider,
    },
    subscriptions: {
      enabled: config.subscriptions.enabled,
      provider: config.subscriptions.provider,
      defaultPlanCode: config.subscriptions.defaultPlanCode,
      trialDays: config.subscriptions.trialDays,
    },
    analytics: {
      enabled: config.analytics.enabled,
      provider: config.analytics.provider,
      sampleRate: config.analytics.sampleRate,
    },
  };
}

function logConfigSummary(config, logger = console) {
  logger.info('[config] startup configuration (redacted)');
  logger.info(JSON.stringify(createRedactedConfig(config), null, 2));
}

function getEnv(rawEnv = process.env) {
  if (rawEnv === process.env) {
    if (!cachedEnv) {
      cachedEnv = parseEnvironment(rawEnv);
    }
    return cachedEnv;
  }
  return parseEnvironment(rawEnv);
}

function getPublicEnv(rawEnv = process.env) {
  return createPublicConfig(getEnv(rawEnv));
}

module.exports = {
  getEnv,
  getPublicEnv,
  parseEnvironment,
  createPublicConfig,
  createRedactedConfig,
  logConfigSummary,
};