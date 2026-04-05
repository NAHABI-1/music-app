const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const { StorageProvider } = require('./storage.provider');

class S3StorageProvider extends StorageProvider {
  constructor(config) {
    super();

    this.config = config;
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: config.provider === 'minio',
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
    });
  }

  async createSignedUploadUrl(params) {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: params.storageKey,
      ContentType: params.mimeType,
      ContentLength: params.fileSizeBytes,
      Metadata: {
        ownerUserId: params.ownerUserId,
        uploadId: params.uploadId,
      },
    });

    const expiresIn = params.expiresInSeconds || this.config.signedUrlTtlSeconds;
    const signedUrl = await getSignedUrl(this.client, command, { expiresIn });

    return {
      signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      method: 'PUT',
      headers: {
        'content-type': params.mimeType,
      },
    };
  }

  async createSignedAccessUrl(params) {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: params.storageKey,
      ResponseContentType: params.mimeType || undefined,
      ResponseContentDisposition: params.download ? 'attachment' : 'inline',
    });

    const expiresIn = params.expiresInSeconds || this.config.signedUrlTtlSeconds;
    const signedUrl = await getSignedUrl(this.client, command, { expiresIn });

    return {
      signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      method: 'GET',
    };
  }
}

module.exports = {
  S3StorageProvider,
};
