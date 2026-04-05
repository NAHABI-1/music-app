class NotificationsError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'NotificationsError';
    this.statusCode = statusCode;
    this.code = code;
    if (details) {
      this.details = details;
    }
  }
}

module.exports = {
  NotificationsError,
};