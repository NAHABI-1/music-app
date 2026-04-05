class AnalyticsError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'AnalyticsError';
    this.statusCode = statusCode;
    this.code = code;
    if (details) {
      this.details = details;
    }
  }
}

module.exports = {
  AnalyticsError,
};