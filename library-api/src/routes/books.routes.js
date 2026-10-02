import express from "express";

import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/books.controller.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.get("/", getBooks);
router.post("/", requireAuth, requireRole("librarian", "admin"), createBook);
router.get("/:id", getBookById);
// router.put("/:id", updateBook);
router.patch("/:id", requireAuth, requireRole("librarian", "admin"), updateBook);
router.delete("/:id", requireAuth, requireRole("admin"), deleteBook);

export default router;
