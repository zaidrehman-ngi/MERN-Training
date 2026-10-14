import { inspect } from "node:util";
import { ApiError } from "../errors/ApiError.js";
import config from "../config/config.js";
import logger from "../config/logger.js";

const errorHandler = (err, req, res, next) => {
  const isErrorObject = err !== null && typeof err === "object";
  const isMalformedJson = isErrorObject && err.type === "entity.parse.failed";
  const isExpected = err instanceof ApiError || isMalformedJson;
  const isDevelopment = config.nodeEnv === "development";
  const statusCode = isMalformedJson
    ? 400
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

  const logDetails =
    config.nodeEnv === "development"
      ? inspect(err, { depth: 5 })
      : err instanceof Error
        ? `${err.name}: ${err.message}`
        : inspect(err, { depth: 5 });
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
