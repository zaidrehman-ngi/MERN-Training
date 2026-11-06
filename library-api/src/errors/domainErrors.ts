export type ErrorDetail = { field: string; message: string };

type DomainErrorOptions = { code?: string; details?: ErrorDetail[] };

// errors the services throw; they carry no HTTP status, errorHandler picks it
class DomainError extends Error {
  code: string;
  details: ErrorDetail[];
  isOperational = true;

  constructor(
    message: string,
    { code = "DOMAIN_ERROR", details = [] }: DomainErrorOptions = {},
  ) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.details = details;
  }
}

class NotFoundError extends DomainError {
  constructor(message: string, options: DomainErrorOptions = {}) {
    super(message, { code: "NOT_FOUND", ...options });
  }
}

class ConflictError extends DomainError {
  constructor(message: string, options: DomainErrorOptions = {}) {
    super(message, { code: "CONFLICT", ...options });
  }
}

class AuthenticationError extends DomainError {
  constructor(
    message = "Authentication required.",
    options: DomainErrorOptions = {},
  ) {
    super(message, { code: "UNAUTHORIZED", ...options });
  }
}

class ForbiddenError extends DomainError {
  constructor(
    message = "You can only do this to your own request.",
    options: DomainErrorOptions = {},
  ) {
    super(message, { code: "FORBIDDEN", ...options });
  }
}

class InvalidValueError extends DomainError {
  constructor(
    message = "One of the values is not allowed.",
    options: DomainErrorOptions = {},
  ) {
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
  constructor(memberId: string, limit: number) {
    super(`Members can have at most ${limit} open borrow requests.`, {
      code: "BORROW_LIMIT_REACHED",
      details: [
        { field: "userId", message: `${memberId} already has ${limit}.` },
      ],
    });
  }
}

export {
  DomainError,
  NotFoundError,
  ConflictError,
  AuthenticationError,
  ForbiddenError,
  InvalidValueError,
  IsbnTakenError,
  EmailTakenError,
  BorrowLimitReachedError,
};
