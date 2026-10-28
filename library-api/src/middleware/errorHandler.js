import { inspect } from "node:util";
import { ApiError } from "../errors/ApiError.js";
import {
  AuthenticationError,
  ConflictError,
  DomainError,
  InvalidValueError,
  NotFoundError,
} from "../errors/domainErrors.js";
import config from "../config/config.js";
import logger from "../config/logger.js";

// Services only say what went wrong; this is the one place that decides
// what that means in HTTP.
const statusForDomainError = (err) => {
  if (err instanceof NotFoundError) return 404;
  if (err instanceof ConflictError) return 409;
  if (err instanceof AuthenticationError) return 401;
  if (err instanceof InvalidValueError) return 422;
  return 400;
};

const errorHandler = (originalErr, req, res, next) => {
  // the repositories already turned database errors into our own errors
  const err = originalErr;
  const isErrorObject = err !== null && typeof err === "object";
  const isMalformedJson = isErrorObject && err.type === "entity.parse.failed";
  const isDomainError = err instanceof DomainError;
  const isExpected = err instanceof ApiError || isDomainError || isMalformedJson;
  const isDevelopment = config.nodeEnv === "development";
  const statusCode = isMalformedJson
    ? 400
    : isDomainError
      ? statusForDomainError(err)
      : err instanceof ApiError && Number.isInteger(err.statusCode)
      ? err.statusCode
      : 500;
  const response = isExpected
    ? {
        error: isMalformedJson ? "BAD_REQUEST" : err.code,
        message: isMalformedJson
          ? "Request body contains invalid JSON."
          : err.message,
        details: isMalformedJson
          ? []
          : Array.isArray(err.details)
            ? err.details
            : [],
      }
    : {
        error: "INTERNAL_SERVER_ERROR",
        message:
          isDevelopment && err instanceof Error
            ? err.message
            : isDevelopment && typeof err === "string"
              ? err
              : "An unexpected error occurred.",
        details: [],
      };

  // A broken JSON body error has the raw body on it (and its message can quote
  // part of it), which could be a password, so never log it.
  const logDetails = isMalformedJson
    ? "Request body contains invalid JSON (body not logged)."
    : config.nodeEnv === "development"
      ? inspect(originalErr, { depth: 5 })
      : originalErr instanceof Error
        ? `${originalErr.name}: ${originalErr.message}`
        : inspect(originalErr, { depth: 5 });
  if (isExpected) {
    logger.warn(
      `${req.requestId} ${req.method} ${req.originalUrl}: ${statusCode} ${response.error} ${logDetails}`,
    );
  } else {
    logger.error(
      `${req.requestId} ${req.method} ${req.originalUrl}: ${statusCode} ${response.error}`,
      logDetails,
    );
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
