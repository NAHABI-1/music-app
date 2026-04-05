class BillingError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'BillingError';
    this.statusCode = statusCode;
    this.code = code;
    if (details) {
      this.details = details;
    }
  }
}

module.exports = {
  BillingError,
};