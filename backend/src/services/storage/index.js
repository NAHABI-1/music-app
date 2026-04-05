const { getStorageConfig } = require('../../config/storage');
const { S3StorageProvider } = require('./s3StorageProvider');

function createStorageProvider(config) {
  return new S3StorageProvider(config || getStorageConfig());
}

module.exports = {
  createStorageProvider,
};
