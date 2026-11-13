import express from "express";
import {
  getBorrowRequests,
  getOverdueBorrowRequests,
  getBorrowRequestById,
  createBorrowRequest,
  updateBorrowRequest,
  cancelBorrowRequest,
  getQueuePosition,
  returnBorrowedBook,
  waiveFine,
} from "../controllers/borrowRequests.controller.ts";
import requireAuth from "../middleware/requireAuth.ts";
import requireRole from "../middleware/requireRole.ts";
import { ADMIN_ROLES, STAFF_ROLES } from "../types/member.ts";
import validate from "../middleware/validate.ts";
import { idParamsSchema } from "../schemas/common.ts";
import {
  borrowRequestQuerySchema,
  createBorrowRequestSchema,
  updateBorrowRequestSchema,
} from "../schemas/borrowRequests.schema.ts";

const router = express.Router();

router.get(
  "/",
  requireAuth,
  validate(borrowRequestQuerySchema, "query"),
  getBorrowRequests,
);

router.post(
  "/",
  requireAuth,
  validate(createBorrowRequestSchema, "body"),
  createBorrowRequest,
);

// before "/:id", otherwise "overdue" would be taken as an id
router.get(
  "/overdue",
  requireAuth,
  requireRole(...STAFF_ROLES),
  getOverdueBorrowRequests,
);

router.get(
  "/:id",
  requireAuth,
  validate(idParamsSchema, "params"),
  getBorrowRequestById,
);

router.patch(
  "/:id",
  requireAuth,
  requireRole(...STAFF_ROLES),
  validate(idParamsSchema, "params"),
  validate(updateBorrowRequestSchema, "body"),
  updateBorrowRequest,
);

router.post(
  "/:id/cancel",
  requireAuth,
  validate(idParamsSchema, "params"),
  cancelBorrowRequest,
);

router.get(
  "/:id/queue",
  requireAuth,
  validate(idParamsSchema, "params"),
  getQueuePosition,
);

router.post(
  "/:id/return",
  requireAuth,
  requireRole(...STAFF_ROLES),
  validate(idParamsSchema, "params"),
  returnBorrowedBook,
);

router.post(
  "/:id/waive-fine",
  requireAuth,
  requireRole(...ADMIN_ROLES),
  validate(idParamsSchema, "params"),
  waiveFine,
);

export default router;
