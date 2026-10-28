import { ConflictError, InvalidValueError } from "../errors/domainErrors.js";

// Prisma puts the original Postgres error under meta.driverAdapterError.cause
const dbCause = (err) => err?.meta?.driverAdapterError?.cause ?? {};

// Turns database errors into our own errors, so nothing above the
// repositories has to know what a Prisma error looks like.
// uniqueErrors: unique index name -> function that makes the error for it.
const translateDbError = (err, uniqueErrors = {}) => {
  const cause = dbCause(err);

  // P2002: unique constraint failed (Postgres 23505)
  if (err?.code === "P2002") {
    const makeError = uniqueErrors[cause.constraint?.index];
    return makeError
      ? makeError()
      : new ConflictError("A record with this value already exists.");
  }

  // P2003: foreign key points at a row that doesn't exist (Postgres 23503)
  if (err?.code === "P2003") {
    return new InvalidValueError("A related record does not exist.");
  }

  // a CHECK constraint, e.g. copies on the shelf going below zero
  if (cause.originalCode === "23514") {
    return new InvalidValueError();
  }

  return err;
};

export default translateDbError;
