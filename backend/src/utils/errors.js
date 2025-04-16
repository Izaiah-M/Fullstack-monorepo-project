/**
 * Base application error class
 */
export class ApplicationError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} status - HTTP status code
   */
  constructor(message, status = 500) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error for invalid input data
 */
export class ValidationError extends ApplicationError {
  /**
   * @param {string} message - Validation error message
   */
  constructor(message = "Invalid input data") {
    super(message, 400);
    this.name = "Validation Error";
  }
}

/**
 * Authentication error for unauthenticated requests
 */
export class UnauthorizedError extends ApplicationError {
  /**
   * @param {string} message - Authentication error message
   */
  constructor(message = "Not authenticated") {
    super(message, 401);
    this.name = "Unauthorized Error";
  }
}

/**
 * Authorization error for insufficient permissions
 */
export class ForbiddenError extends ApplicationError {
  /**
   * @param {string} message - Authorization error message
   */
  constructor(message = "Insufficient permissions") {
    super(message, 403);
    this.name = "Forbidden Error";
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends ApplicationError {
  /**
   * @param {string} message - Not found error message
   */
  constructor(message = "Resource not found") {
    super(message, 404);
    this.name = "Not Found Error";
  }
}

/**
 * Server error for when server has internal issues
 */
export class ServerError extends ApplicationError {
  /**
   * @param {string} message - Server error message
   */
  constructor(message = "Server error, please try again later.") {
    super(message, 500);
    this.name = "Server Error";
  }
}

/**
 * Conflict error for duplicate resources
 */
export class ConflictError extends ApplicationError {
  /**
   * @param {string} message - Conflict error message
   * @param {string} code - Optional error code
   */
  constructor(message = "Resource already exists", code = undefined) {
    super(message, 409, code);
  }
}