class InteractionError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'InteractionError';
    this.statusCode = statusCode;
    this.code = code;
    if (details) {
      this.details = details;
    }
  }
}

module.exports = {
  InteractionError,
};
