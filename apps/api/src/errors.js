/** Domain errors carry an HTTP status; the error middleware in app.js maps them. */
export class NotFoundError extends Error {
  statusCode = 404;
}

export class ConflictError extends Error {
  statusCode = 409;
}

export class ValidationError extends Error {
  statusCode = 400;

  /**
   * @param {string} message
   * @param {unknown} [details]
   */
  constructor(message, details) {
    super(message);
    this.details = details;
  }
}
