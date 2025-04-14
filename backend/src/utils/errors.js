export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "Validation Error";
    this.status = 400;
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Not authenticated") {
    super(message);
    this.name = "Unauthorized Error";
    this.status = 401;
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Insufficient permissions") {
    super(message);
    this.name = "Forbidden Error";
    this.status = 403;
  }
}

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "Not Found Error";
    this.status = 404;
  }
}