import express from "express";

import {
  getBooks,
  getBookById,
  createBook,
  // testRawBody,
  // testValidatedBody,
  // testBooksQuery,
  // testBookId,
  updateBook,
  deleteBook,
} from "../controllers/books.controller.js";

import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import validate from "../middleware/validate.js";
import bookSearchRateLimiter from "../middleware/bookSearchRateLimiter.js";
import {
  bookIdSchema,
  booksQuerySchema,
  createBookSchema,
  updateBookSchema,
} from "../schemas/books.schema.js";

const router = express.Router();

router.get(
  "/",
  bookSearchRateLimiter,
  validate(booksQuerySchema, "query"),
  getBooks,
);

router.post(
  "/",
  requireAuth,
  requireRole("librarian", "admin"),
  validate(createBookSchema, "body"),
  createBook,
);

// router.post("/test-raw", testRawBody);

// router.post("/test-validated", testValidatedBody);

// router.get("/test-query", testBooksQuery);

// router.get("/test-id/:id", testBookId);

router.get("/:id", validate(bookIdSchema, "params"), getBookById);

router.patch(
  "/:id",
  requireAuth,
  requireRole("librarian", "admin"),
  validate(bookIdSchema, "params"),
  validate(updateBookSchema, "body"),
  updateBook,
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  validate(bookIdSchema, "params"),
  deleteBook,
);

export default router;
