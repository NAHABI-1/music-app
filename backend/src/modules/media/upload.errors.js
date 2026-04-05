class UploadError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'UploadError';
    this.statusCode = statusCode;
    this.code = code;
    if (details) {
      this.details = details;
    }
  }
}

module.exports = {
  UploadError,
};
