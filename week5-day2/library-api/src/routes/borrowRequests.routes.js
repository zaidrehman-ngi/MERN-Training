import express from "express";
import {
  getBorrowRequests,
  getBorrowRequestById,
  createBorrowRequest,
  updateBorrowRequest,
  returnBorrowedBook,
} from "../controllers/borrowRequests.controller.js";

const router = express.Router();

router.get("/", getBorrowRequests);
router.post("/", createBorrowRequest);
router.get("/:id", getBorrowRequestById);
router.patch("/:id", updateBorrowRequest);
router.post("/:id/return", returnBorrowedBook);

export default router;
