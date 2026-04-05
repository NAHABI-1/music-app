const test = require('node:test');
const assert = require('node:assert/strict');

const { parseEnvironment, createPublicConfig, createRedactedConfig } = require('../../src/config/env');

function buildBaseEnv(overrides = {}) {
  return {
    NODE_ENV: 'development',
    APP_ENV: 'development',
    APP_NAME: 'CloudTune API',
    APP_VERSION: '0.1.0',
    HOST: '0.0.0.0',
    PORT: '4000',
    APP_ALLOWED_ORIGINS: '',

    JWT_SECRET: 'jwt-secret-value-12345',
    JWT_EXPIRES_IN: '7d',
    REFRESH_TOKEN_SECRET: 'refresh-secret-value-12345',
    REFRESH_TOKEN_EXPIRES_IN: '30d',

    DATABASE_URL: 'postgres://cloudtune:cloudtune@localhost:5432/cloudtune',
    DB_POOL_MIN: '1',
    DB_POOL_MAX: '10',
    DB_STATEMENT_TIMEOUT_MS: '12000',

    STORAGE_PROVIDER: 'minio',
    STORAGE_ENDPOINT: 'localhost',
    STORAGE_PORT: '9000',
    STORAGE_USE_SSL: 'false',
    STORAGE_ACCESS_KEY: 'cloudtune',
    STORAGE_SECRET_KEY: 'replace-with-a-secret',
    STORAGE_BUCKET: 'cloudtune-media',
    STORAGE_REGION: 'us-east-1',

    AUDIO_MAX_UPLOAD_MB: '250',
    AUDIO_ALLOWED_MIME_TYPES: 'audio/mpeg,audio/flac',
    AUDIO_WAVEFORM_ENABLED: 'true',
    AUDIO_OFFLINE_TTL_HOURS: '720',

    NOTIFICATIONS_PUSH_ENABLED: 'true',
    NOTIFICATIONS_EMAIL_ENABLED: 'true',
    NOTIFICATIONS_PROVIDER: 'none',
    NOTIFICATIONS_API_KEY: '',
    NOTIFICATIONS_FROM_EMAIL: 'noreply@cloudtune.local',

    ADS_ENABLED: 'false',
    ADS_PROVIDER: 'none',
    ADS_APP_ID: '',
    ADS_BANNER_UNIT_ID: '',
    ADS_INTERSTITIAL_UNIT_ID: '',
    ADS_REWARDED_UNIT_ID: '',

    SUBSCRIPTIONS_ENABLED: 'true',
    SUBSCRIPTIONS_PROVIDER: 'none',
    SUBSCRIPTIONS_WEBHOOK_SECRET: '',
    SUBSCRIPTIONS_DEFAULT_PLAN_CODE: 'FREE',
    SUBSCRIPTIONS_TRIAL_DAYS: '14',

    ANALYTICS_ENABLED: 'true',
    ANALYTICS_PROVIDER: 'none',
    ANALYTICS_WRITE_KEY: '',
    ANALYTICS_SAMPLE_RATE: '1',
    ...overrides,
  };
}

test('parses string booleans correctly', () => {
  const parsed = parseEnvironment(
    buildBaseEnv({
      STORAGE_USE_SSL: 'false',
      AUDIO_WAVEFORM_ENABLED: 'false',
      ADS_ENABLED: 'false',
      NOTIFICATIONS_PUSH_ENABLED: 'false',
    })
  );

  assert.equal(parsed.storage.useSsl, false);
  assert.equal(parsed.audio.waveformEnabled, false);
  assert.equal(parsed.ads.enabled, false);
  assert.equal(parsed.notifications.pushEnabled, false);
});

test('requires CORS origins outside development', () => {
  assert.throws(
    () =>
      parseEnvironment(
        buildBaseEnv({
          APP_ENV: 'production',
          NODE_ENV: 'production',
          APP_ALLOWED_ORIGINS: '',
        })
      ),
    /APP_ALLOWED_ORIGINS/
  );
});

test('requires provider secrets when enabled', () => {
  assert.throws(
    () =>
      parseEnvironment(
        buildBaseEnv({
          NOTIFICATIONS_PROVIDER: 'firebase',
          NOTIFICATIONS_API_KEY: '',
        })
      ),
    /NOTIFICATIONS_API_KEY/
  );

  assert.throws(
    () =>
      parseEnvironment(
        buildBaseEnv({
          ADS_ENABLED: 'true',
          ADS_PROVIDER: 'none',
        })
      ),
    /ADS_PROVIDER/
  );

  assert.throws(
    () =>
      parseEnvironment(
        buildBaseEnv({
          ANALYTICS_PROVIDER: 'segment',
          ANALYTICS_WRITE_KEY: '',
        })
      ),
    /ANALYTICS_WRITE_KEY/
  );
});

test('redacts and excludes secrets from public config', () => {
  const parsed = parseEnvironment(
    buildBaseEnv({
      APP_ALLOWED_ORIGINS: 'https://app.example.com',
      ADS_PROVIDER: 'admob',
      ADS_APP_ID: 'ca-app-pub-test',
    })
  );

  const redacted = createRedactedConfig(parsed);
  const pub = createPublicConfig(parsed);

  assert.equal(redacted.auth.jwtSecret, '[REDACTED]');
  assert.equal(redacted.database.url, '[REDACTED]');
  assert.equal(typeof pub.auth, 'undefined');
  assert.equal(typeof pub.database, 'undefined');
  assert.equal(pub.app.name, 'CloudTune API');
});
