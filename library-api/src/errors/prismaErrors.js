import { ApiError, conflict } from "./ApiError.js";

// Friendlier messages for the unique constraints the API can hit.
const uniqueMessages = {
  books_active_isbn_unique: {
    message: "A book with this ISBN already exists.",
    field: "isbn",
    detail: "ISBN must be unique.",
  },
  members_active_email_unique: {
    message: "A user with this email already exists.",
    field: "email",
    detail: "Email must be unique.",
  },
};

// Prisma puts the original Postgres error under meta.driverAdapterError.cause
const getCause = (err) => err.meta?.driverAdapterError?.cause ?? {};

// Turns the database errors Prisma throws into our own ApiError, so the
// error handler can send them in the normal { error, message, details } shape.
// Anything else is returned as it is.
const translatePrismaError = (err) => {
  if (err?.name !== "PrismaClientKnownRequestError") {
    return err;
  }

  const cause = getCause(err);
  const constraint = cause.constraint?.index;

  // P2002: unique constraint failed (Postgres 23505)
  if (err.code === "P2002") {
    const known = uniqueMessages[constraint];
    if (known) {
      return conflict(known.message, [
        { field: known.field, message: known.detail },
      ]);
    }
    return conflict("A record with this value already exists.");
  }

  // P2003: foreign key points at a row that doesn't exist (Postgres 23503)
  if (err.code === "P2003") {
    // constraint names look like book_copies_book_id_fkey
    const field = constraint
      ?.replace(`${err.meta?.modelName}_`, "")
      .replace(/_fkey$/, "");
    // 422 like my Week 1 spec: the request is fine, the value isn't
    return new ApiError("A related record does not exist.", 422, {
      code: "VALIDATION_ERROR",
      details: field ? [{ field, message: "No record found with this id." }] : [],
    });
  }

  // P2039 with Postgres 23514: a CHECK constraint rejected the value
  if (cause.originalCode === "23514") {
    return new ApiError("One of the values is not allowed.", 422, {
      code: "VALIDATION_ERROR",
    });
  }

  return err;
};

export default translatePrismaError;
