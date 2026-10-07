import { badRequest } from "../errors/ApiError.js";

const sources = new Set(["body", "query", "params"]);

const validate = (schema, source) => {
  if (!sources.has(source)) {
    throw new TypeError(
      `Unsupported validation source "${source}". Expected "body", "query", or "params".`,
    );
  }

  return (req, res, next) => {
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

    if (source === "query") {
      Object.defineProperty(req, "query", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: result.data,
      });
    } else {
      req[source] = result.data;
    }

    next();
  };
};

export default validate;
