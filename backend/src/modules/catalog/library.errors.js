class LibraryError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'LibraryError';
    this.statusCode = statusCode;
    this.code = code;
    if (details) {
      this.details = details;
    }
  }
}

module.exports = {
  LibraryError,
};
