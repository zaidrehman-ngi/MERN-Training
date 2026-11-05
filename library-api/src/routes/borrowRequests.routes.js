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
import { ROLES, STAFF_ROLES } from "../types/member.ts";
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
  requireRole(...STAFF_ROLES),
  validate(borrowRequestIdSchema, "params"),
  approveBorrowRequest,
);

router.get(
  "/",
  requireAuth,
  requireRole(...ROLES),
  validate(borrowRequestQuerySchema, "query"),
  getBorrowRequests,
);

router.post(
  "/",
  requireAuth,
  requireRole(...ROLES),
  validate(createBorrowRequestSchema, "body"),
  createBorrowRequest,
);

router.get(
  "/:id",
  requireAuth,
  requireRole(...ROLES),
  validate(borrowRequestIdSchema, "params"),
  getBorrowRequestById,
);

router.patch(
  "/:id",
  requireAuth,
  requireRole(...STAFF_ROLES),
  validate(borrowRequestIdSchema, "params"),
  validate(updateBorrowRequestSchema, "body"),
  updateBorrowRequest,
);

router.post(
  "/:id/cancel",
  requireAuth,
  requireRole(...ROLES),
  validate(borrowRequestIdSchema, "params"),
  cancelBorrowRequest,
);

router.get(
  "/:id/queue",
  requireAuth,
  requireRole(...ROLES),
  validate(borrowRequestIdSchema, "params"),
  getQueuePosition,
);

router.post(
  "/:id/return",
  requireAuth,
  requireRole(...STAFF_ROLES),
  validate(borrowRequestIdSchema, "params"),
  returnBorrowedBook,
);

export default router;
