import { ConflictError, InvalidValueError } from "../errors/domainErrors.js";

type DbError = {
  code?: string;
  meta?: {
    driverAdapterError?: {
      cause?: { constraint?: { index?: string }; originalCode?: string };
    };
  };
};

// turns Prisma errors into our own errors
const translateDbError = (
  err: unknown,
  uniqueErrors: Record<string, () => Error> = {},
): unknown => {
  const dbError = (err ?? {}) as DbError;
  // the original Postgres error
  const cause = dbError.meta?.driverAdapterError?.cause ?? {};

  // P2002: unique constraint failed
  if (dbError.code === "P2002") {
    const index = cause.constraint?.index;
    const makeError = index ? uniqueErrors[index] : undefined;
    return makeError
      ? makeError()
      : new ConflictError("A record with this value already exists.");
  }

  // P2003: the related row doesn't exist
  if (dbError.code === "P2003") {
    return new InvalidValueError("A related record does not exist.");
  }

  // 23514: a CHECK constraint failed
  if (cause.originalCode === "23514") {
    return new InvalidValueError();
  }

  return err;
};

export default translateDbError;
