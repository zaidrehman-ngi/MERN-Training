import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { badRequest } from "../errors/ApiError.js";

type Source = "body" | "query" | "params";

const validate =
  (schema: ZodType, source: Source): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      throw badRequest(
        "Some fields have invalid values.",
        result.error.issues.map((issue) => ({
          field: issue.path.length > 0 ? issue.path.join(".") : source,
          message: issue.message,
        })),
        "VALIDATION_ERROR",
      );
    }

    // Express 5 makes req.query a getter, so the parsed value is defined over it
    Object.defineProperty(req, source, {
      configurable: true,
      enumerable: true,
      writable: true,
      value: result.data,
    });
    next();
  };

export default validate;
