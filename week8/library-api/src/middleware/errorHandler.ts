import { inspect } from "node:util";
import type { ErrorRequestHandler } from "express";
import { ApiError } from "../errors/ApiError.ts";
import {
  AuthenticationError,
  ConflictError,
  DomainError,
  ForbiddenError,
  InvalidValueError,
  NotFoundError,
} from "../errors/domainErrors.ts";
import config from "../config/config.ts";
import logger from "../config/logger.ts";

type ErrorBody = { error: string; message: string; details: unknown[] };

const statusForDomainError = (err: DomainError) => {
  if (err instanceof NotFoundError) return 404;
  if (err instanceof ConflictError) return 409;
  if (err instanceof AuthenticationError) return 401;
  if (err instanceof ForbiddenError) return 403;
  if (err instanceof InvalidValueError) return 422;
  return 400;
};

const isMalformedJson = (err: unknown) =>
  typeof err === "object" &&
  err !== null &&
  "type" in err &&
  err.type === "entity.parse.failed";

const errorHandler: ErrorRequestHandler = (err: unknown, req, res, _next) => {
  const isDevelopment = config.nodeEnv === "development";
  let statusCode = 500;
  let body: ErrorBody = {
    error: "INTERNAL_SERVER_ERROR",
    message:
      isDevelopment && err instanceof Error
        ? err.message
        : "An unexpected error occurred.",
    details: [],
  };
  // the raw body of broken JSON could hold a password, so it is never logged
  let logDetails = isDevelopment
    ? inspect(err, { depth: 5 })
    : err instanceof Error
      ? `${err.name}: ${err.message}`
      : inspect(err, { depth: 5 });

  if (isMalformedJson(err)) {
    statusCode = 400;
    body = {
      error: "BAD_REQUEST",
      message: "Request body contains invalid JSON.",
      details: [],
    };
    logDetails = "Request body contains invalid JSON (body not logged).";
  } else if (err instanceof DomainError || err instanceof ApiError) {
    statusCode =
      err instanceof DomainError ? statusForDomainError(err) : err.statusCode;
    body = {
      error: err.code,
      message: err.message,
      details: Array.isArray(err.details) ? err.details : [],
    };
  }

  const summary = `${req.requestId} ${req.method} ${req.originalUrl}: ${statusCode} ${body.error}`;
  if (statusCode < 500) {
    logger.warn(`${summary} ${logDetails}`);
  } else {
    logger.error(summary, logDetails);
  }

  res.status(statusCode).json(body);
};

export default errorHandler;
