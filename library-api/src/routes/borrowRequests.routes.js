import express from "express";
import {
  getBorrowRequests,
  getBorrowRequestById,
  createBorrowRequest,
  updateBorrowRequest,
  returnBorrowedBook,
} from "../controllers/borrowRequests.controller.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import validate from "../middleware/validate.js";
import {
  borrowRequestIdSchema,
  borrowRequestQuerySchema,
  createBorrowRequestSchema,
  updateBorrowRequestSchema,
} from "../schemas/borrowRequests.schema.js";

const router = express.Router();

const approveHandler = (req, res) => {
  res.status(200).json({
    message: "Borrow request approved",
  });
};

router.post(
  "/:id/approve",
  requireAuth,
  requireRole("librarian"),
  approveHandler,
);

router.get(
  "/",
  requireAuth,
  requireRole("user", "librarian", "admin"),
  validate(borrowRequestQuerySchema, "query"),
  getBorrowRequests,
);

router.post(
  "/",
  requireAuth,
  requireRole("user"),
  validate(createBorrowRequestSchema, "body"),
  createBorrowRequest,
);

router.get(
  "/:id",
  requireAuth,
  requireRole("user", "librarian", "admin"),
  validate(borrowRequestIdSchema, "params"),
  getBorrowRequestById,
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("librarian", "admin"),
  validate(borrowRequestIdSchema, "params"),
  validate(updateBorrowRequestSchema, "body"),
  updateBorrowRequest,
);

router.post(
  "/:id/return",
  requireAuth,
  requireRole("user", "librarian", "admin"),
  validate(borrowRequestIdSchema, "params"),
  returnBorrowedBook,
);

export default router;
