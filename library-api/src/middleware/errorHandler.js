import { inspect } from "node:util";
import { ApiError } from "../errors/ApiError.js";

const errorHandler = (err, req, res, next) => {
  const isErrorObject = err !== null && typeof err === "object";
  const isMalformedJson = isErrorObject && err.type === "entity.parse.failed";
  const isExpected = err instanceof ApiError || isMalformedJson;
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
        message: "An unexpected error occurred.",
        details: [],
      };

  const logDetails = inspect(err, { depth: 5 });
  if (isExpected) {
    console.warn(
      `${req.requestId} ${req.method} ${req.originalUrl}: ${statusCode} ${response.error} ${logDetails}`,
    );
  } else {
    console.error(
      `${req.requestId} ${req.method} ${req.originalUrl}: ${statusCode} ${response.error}`,
      logDetails,
    );
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
