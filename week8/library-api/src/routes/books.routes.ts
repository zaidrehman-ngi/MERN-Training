import express from "express";
import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/books.controller.ts";
import requireAuth from "../middleware/requireAuth.ts";
import requireRole from "../middleware/requireRole.ts";
import { STAFF_ROLES, ADMIN_ROLES } from "../types/member.ts";
import validate from "../middleware/validate.ts";
import bookSearchRateLimiter from "../middleware/bookSearchRateLimiter.ts";
import { idParamsSchema } from "../schemas/common.ts";
import {
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

router.get("/:id", validate(idParamsSchema, "params"), getBookById);

router.patch(
  "/:id",
  requireAuth,
  requireRole(...STAFF_ROLES),
  validate(idParamsSchema, "params"),
  validate(updateBookSchema, "body"),
  updateBook,
);

router.delete(
  "/:id",
  requireAuth,
  requireRole(...ADMIN_ROLES),
  validate(idParamsSchema, "params"),
  deleteBook,
);

export default router;
