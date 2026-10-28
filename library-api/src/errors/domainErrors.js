// Errors the services throw. They say what went wrong in the library's terms
// (the class and a code) and never carry an HTTP status, so a route, a socket
// handler or the nightly job can all catch them. Only the error handler turns
// them into a status code (see statusForDomainError in errorHandler.js).
class DomainError extends Error {
  constructor(message, { code, details = [] } = {}) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.details = details;
    // expected failures (a rule said no), not bugs
    this.isOperational = true;
  }
}

// the thing asked for doesn't exist
class NotFoundError extends DomainError {
  constructor(message, options = {}) {
    super(message, { code: "NOT_FOUND", ...options });
  }
}

// the action clashes with the current state (duplicate ISBN, no copies left)
class ConflictError extends DomainError {
  constructor(message, options = {}) {
    super(message, { code: "CONFLICT", ...options });
  }
}

// we don't know who this is (bad password, bad or expired token)
class AuthenticationError extends DomainError {
  constructor(message = "Authentication required.", options = {}) {
    super(message, { code: "UNAUTHORIZED", ...options });
  }
}

// a value breaks a rule the data has to follow (more on the shelf than owned)
class InvalidValueError extends DomainError {
  constructor(message = "One of the values is not allowed.", options = {}) {
    super(message, { code: "VALIDATION_ERROR", ...options });
  }
}

class IsbnTakenError extends ConflictError {
  constructor() {
    super("A book with this ISBN already exists.", {
      details: [{ field: "isbn", message: "ISBN must be unique." }],
    });
  }
}

class EmailTakenError extends ConflictError {
  constructor() {
    super("A user with this email already exists.", {
      details: [{ field: "email", message: "Email must be unique." }],
    });
  }
}

class BorrowLimitReachedError extends ConflictError {
  constructor(memberId, limit) {
    super(`Members can have at most ${limit} open borrow requests.`, {
      code: "BORROW_LIMIT_REACHED",
      details: [
        { field: "userId", message: `${memberId} already has ${limit}.` },
      ],
    });
    this.memberId = memberId;
    this.limit = limit;
  }
}

export {
  DomainError,
  NotFoundError,
  ConflictError,
  AuthenticationError,
  InvalidValueError,
  IsbnTakenError,
  EmailTakenError,
  BorrowLimitReachedError,
};
