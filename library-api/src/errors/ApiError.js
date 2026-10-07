class ApiError extends Error {
  constructor(
    message,
    statusCode,
    { isOperational = true, code = "API_ERROR", details = [] } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

const notFound = (message = "Resource not found.") =>
  new ApiError(message, 404, { code: "NOT_FOUND" });

const badRequest = (
  message = "Bad request.",
  details = [],
  code = "BAD_REQUEST",
) => new ApiError(message, 400, { code, details });

const conflict = (message = "Resource conflict.", details = []) =>
  new ApiError(message, 409, { code: "CONFLICT", details });

const forbidden = (message = "Forbidden.") =>
  new ApiError(message, 403, { code: "FORBIDDEN" });

const unauthorized = (
  message = "Authentication required.",
  code = "UNAUTHORIZED",
) => new ApiError(message, 401, { code });

export { ApiError, notFound, badRequest, conflict, forbidden, unauthorized };
