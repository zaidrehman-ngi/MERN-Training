import type { ErrorDetail } from "./domainErrors.ts";

// HTTP-level errors that already know their status (no route, bad input, role, rate limit)
class ApiError extends Error {
  statusCode: number;
  code: string;
  details: ErrorDetail[];
  isOperational = true;

  constructor(
    message: string,
    statusCode: number,
    {
      code = "API_ERROR",
      details = [],
    }: { code?: string; details?: ErrorDetail[] } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

const notFound = (message = "Resource not found.") =>
  new ApiError(message, 404, { code: "NOT_FOUND" });

const badRequest = (
  message = "Bad request.",
  details: ErrorDetail[] = [],
  code = "BAD_REQUEST",
) => new ApiError(message, 400, { code, details });

const forbidden = (message = "Forbidden.") =>
  new ApiError(message, 403, { code: "FORBIDDEN" });

const tooManyRequests = (
  message = "Too many requests. Please try again later.",
) => new ApiError(message, 429, { code: "RATE_LIMIT_EXCEEDED" });

export { ApiError, notFound, badRequest, forbidden, tooManyRequests };
