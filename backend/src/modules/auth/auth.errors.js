class AuthError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
    this.code = code;
    if (details) {
      this.details = details;
    }
  }
}

module.exports = { AuthError };
