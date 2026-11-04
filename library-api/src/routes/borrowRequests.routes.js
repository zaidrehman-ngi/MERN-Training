import express from "express";
import {
  getBorrowRequests,
  getBorrowRequestById,
  createBorrowRequest,
  updateBorrowRequest,
  approveBorrowRequest,
  cancelBorrowRequest,
  getQueuePosition,
  returnBorrowedBook,
} from "../controllers/borrowRequests.controller.ts";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import validate from "../middleware/validate.js";
import {
  borrowRequestIdSchema,
  borrowRequestQuerySchema,
  createBorrowRequestSchema,
  updateBorrowRequestSchema,
} from "../schemas/borrowRequests.schema.ts";

const router = express.Router();

router.post(
  "/:id/approve",
  requireAuth,
  requireRole("librarian", "admin", "super admin"),
  validate(borrowRequestIdSchema, "params"),
  approveBorrowRequest,
);

router.get(
  "/",
  requireAuth,
  requireRole("user", "librarian", "admin", "super admin"),
  validate(borrowRequestQuerySchema, "query"),
  getBorrowRequests,
);

router.post(
  "/",
  requireAuth,
  requireRole("user", "librarian", "admin", "super admin"),
  validate(createBorrowRequestSchema, "body"),
  createBorrowRequest,
);

router.get(
  "/:id",
  requireAuth,
  requireRole("user", "librarian", "admin", "super admin"),
  validate(borrowRequestIdSchema, "params"),
  getBorrowRequestById,
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("librarian", "admin", "super admin"),
  validate(borrowRequestIdSchema, "params"),
  validate(updateBorrowRequestSchema, "body"),
  updateBorrowRequest,
);

router.post(
  "/:id/cancel",
  requireAuth,
  requireRole("user", "librarian", "admin", "super admin"),
  validate(borrowRequestIdSchema, "params"),
  cancelBorrowRequest,
);

router.get(
  "/:id/queue",
  requireAuth,
  requireRole("user", "librarian", "admin", "super admin"),
  validate(borrowRequestIdSchema, "params"),
  getQueuePosition,
);

router.post(
  "/:id/return",
  requireAuth,
  requireRole("librarian", "admin", "super admin"),
  validate(borrowRequestIdSchema, "params"),
  returnBorrowedBook,
);

export default router;
