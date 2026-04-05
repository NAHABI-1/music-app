class OfflineError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'OfflineError';
    this.statusCode = statusCode;
    this.code = code;
    if (details) {
      this.details = details;
    }
  }
}

module.exports = {
  OfflineError,
};
