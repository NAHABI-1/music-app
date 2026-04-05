class ProfileError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'ProfileError';
    this.statusCode = statusCode;
    this.code = code;
    if (details) {
      this.details = details;
    }
  }
}

module.exports = { ProfileError };
