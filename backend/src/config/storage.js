const { getEnv } = require('./env');

function getStorageConfig() {
  const env = getEnv();

  return {
    provider: env.storage.provider,
    endpoint: env.storage.endpoint,
    port: env.storage.port,
    useSsl: env.storage.useSsl,
    accessKey: env.storage.accessKey,
    secretKey: env.storage.secretKey,
    bucket: env.storage.bucket,
    region: env.storage.region,
    signedUrlTtlSeconds: env.storage.signedUrlTtlSeconds,
  };
}

module.exports = { getStorageConfig };