class AdsError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'AdsError';
    this.statusCode = statusCode;
    this.code = code;
    if (details) {
      this.details = details;
    }
  }
}

module.exports = {
  AdsError,
};