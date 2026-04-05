const { z } = require('zod');

const strictBoolean = z.preprocess((value) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }
  return value;
}, z.boolean());

const appEnvSchema = z.object({
  nodeEnv: z.enum(['development', 'staging', 'production']),
  appEnv: z.enum(['development', 'staging', 'production']),
  appName: z.string().min(1),
  host: z.string().min(1),
  port: z.coerce.number().int().min(1).max(65535),
  appVersion: z.string().min(1),
  allowedOrigins: z.array(z.string()).default([]),

  jwtSecret: z.string().min(16),
  jwtExpiresIn: z.string().min(1),
  refreshTokenSecret: z.string().min(16),
  refreshTokenExpiresIn: z.string().min(1),
  authPasswordHashRounds: z.coerce.number().int().min(8).max(15),
  authSocialGoogleEnabled: strictBoolean,
  authSocialGoogleClientId: z.string().default(''),
  authSocialAppleEnabled: strictBoolean,
  authSocialAppleServiceId: z.string().default(''),

  databaseUrl: z.string().url(),
  dbPoolMin: z.coerce.number().int().min(0),
  dbPoolMax: z.coerce.number().int().min(1),
  dbStatementTimeoutMs: z.coerce.number().int().min(1000),

  storageProvider: z.enum(['minio', 's3', 'gcs', 'local']),
  storageEndpoint: z.string().min(1),
  storagePort: z.coerce.number().int().min(1).max(65535),
  storageUseSsl: strictBoolean,
  storageAccessKey: z.string().min(1),
  storageSecretKey: z.string().min(1),
  storageBucket: z.string().min(3),
  storageRegion: z.string().min(1),
  storageSignedUrlTtlSeconds: z.coerce.number().int().min(60).max(86400),

  audioMaxUploadMb: z.coerce.number().int().min(1),
  audioAllowedMimeTypes: z.array(z.string().min(1)).min(1),
  audioWaveformEnabled: strictBoolean,
  audioOfflineTtlHours: z.coerce.number().int().min(1),
  playbackSignedUrlTtlSeconds: z.coerce.number().int().min(60).max(86400),

  notificationsPushEnabled: strictBoolean,
  notificationsEmailEnabled: strictBoolean,
  notificationsProvider: z.enum(['none', 'firebase', 'onesignal', 'ses', 'sendgrid']),
  notificationsApiKey: z.string().default(''),
  notificationsFromEmail: z.string().email(),

  adsEnabled: strictBoolean,
  adsProvider: z.enum(['none', 'admob', 'applovin', 'custom']),
  adsAppId: z.string().default(''),
  adsBannerUnitId: z.string().default(''),
  adsInterstitialUnitId: z.string().default(''),
  adsRewardedUnitId: z.string().default(''),

  subscriptionsEnabled: strictBoolean,
  subscriptionsProvider: z.enum(['none', 'stripe', 'revenuecat', 'custom']),
  subscriptionsWebhookSecret: z.string().default(''),
  subscriptionsDefaultPlanCode: z.string().min(1),
  subscriptionsTrialDays: z.coerce.number().int().min(0),

  analyticsEnabled: strictBoolean,
  analyticsProvider: z.enum(['none', 'segment', 'mixpanel', 'amplitude', 'custom']),
  analyticsWriteKey: z.string().default(''),
  analyticsSampleRate: z.coerce.number().min(0).max(1),
}).superRefine((value, context) => {
  if (value.appEnv !== 'development' && value.allowedOrigins.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['allowedOrigins'],
      message: 'APP_ALLOWED_ORIGINS must be set for staging/production.',
    });
  }

  if (value.dbPoolMax < value.dbPoolMin) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dbPoolMax'],
      message: 'DB_POOL_MAX must be greater than or equal to DB_POOL_MIN.',
    });
  }

  if (value.notificationsProvider !== 'none' && !value.notificationsApiKey.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['notificationsApiKey'],
      message: 'NOTIFICATIONS_API_KEY is required when notifications provider is enabled.',
    });
  }

  if (value.adsEnabled && value.adsProvider === 'none') {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['adsProvider'],
      message: 'ADS_PROVIDER must not be none when ADS_ENABLED is true.',
    });
  }

  if (value.adsProvider !== 'none' && !value.adsAppId.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['adsAppId'],
      message: 'ADS_APP_ID is required when ads provider is enabled.',
    });
  }

  if (value.subscriptionsEnabled && value.subscriptionsProvider !== 'none' && !value.subscriptionsWebhookSecret.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['subscriptionsWebhookSecret'],
      message: 'SUBSCRIPTIONS_WEBHOOK_SECRET is required when subscriptions provider is enabled.',
    });
  }

  if (value.analyticsEnabled && value.analyticsProvider !== 'none' && !value.analyticsWriteKey.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['analyticsWriteKey'],
      message: 'ANALYTICS_WRITE_KEY is required when analytics provider is enabled.',
    });
  }

  if (value.authSocialGoogleEnabled && !value.authSocialGoogleClientId.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['authSocialGoogleClientId'],
      message: 'AUTH_SOCIAL_GOOGLE_CLIENT_ID is required when Google social auth is enabled.',
    });
  }

  if (value.authSocialAppleEnabled && !value.authSocialAppleServiceId.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['authSocialAppleServiceId'],
      message: 'AUTH_SOCIAL_APPLE_SERVICE_ID is required when Apple social auth is enabled.',
    });
  }
});

module.exports = { appEnvSchema };