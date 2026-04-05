class StorageProvider {
  async createSignedUploadUrl(_params) {
    throw new Error('createSignedUploadUrl must be implemented by a concrete storage provider.');
  }

  async createSignedAccessUrl(_params) {
    throw new Error('createSignedAccessUrl must be implemented by a concrete storage provider.');
  }
}

module.exports = {
  StorageProvider,
};
