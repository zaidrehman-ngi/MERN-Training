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

const router = express.Router();

const approveHandler = (req, res) => {
  res.status(200).json({
    message: "Borrow request approved",
  });
};

// router.use(requireAuth);
router.post("/:id/approve", requireAuth, requireRole("librarian"), approveHandler);
// router.use(requireAuth);

router.get("/", requireAuth, requireRole("user", "librarian", "admin"), getBorrowRequests);
router.post("/", requireAuth, requireRole("user"), createBorrowRequest);
router.get("/:id", requireAuth, requireRole("user", "librarian", "admin"), getBorrowRequestById);
router.patch("/:id", requireAuth, requireRole("librarian", "admin"), updateBorrowRequest);
router.post("/:id/return", requireAuth, requireRole("user", "librarian", "admin"), returnBorrowedBook);

export default router;
