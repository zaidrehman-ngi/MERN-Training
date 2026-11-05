import express from "express";
import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/books.controller.ts";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import { STAFF_ROLES, ADMIN_ROLES } from "../types/member.ts";
import validate from "../middleware/validate.js";
import bookSearchRateLimiter from "../middleware/bookSearchRateLimiter.js";
import {
  bookIdSchema,
  booksQuerySchema,
  createBookSchema,
  updateBookSchema,
} from "../schemas/books.schema.ts";

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
  requireRole(...STAFF_ROLES),
  validate(createBookSchema, "body"),
  createBook,
);

router.get("/:id", validate(bookIdSchema, "params"), getBookById);

router.patch(
  "/:id",
  requireAuth,
  requireRole(...STAFF_ROLES),
  validate(bookIdSchema, "params"),
  validate(updateBookSchema, "body"),
  updateBook,
);

router.delete(
  "/:id",
  requireAuth,
  requireRole(...ADMIN_ROLES),
  validate(bookIdSchema, "params"),
  deleteBook,
);

export default router;
