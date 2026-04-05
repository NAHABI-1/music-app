class PlaylistError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'PlaylistError';
    this.statusCode = statusCode;
    this.code = code;
    if (details) {
      this.details = details;
    }
  }
}

module.exports = {
  PlaylistError,
};
