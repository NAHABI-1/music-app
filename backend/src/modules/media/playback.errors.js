class PlaybackError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'PlaybackError';
    this.statusCode = statusCode;
    this.code = code;
    if (details) {
      this.details = details;
    }
  }
}

module.exports = {
  PlaybackError,
};
