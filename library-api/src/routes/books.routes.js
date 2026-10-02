import express from "express";

import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/books.controller.js";

const router = express.Router();

// router.use((req, res, next) => {
//   console.log("BOOKS ROUTER:", req.method, req.path);
//   next();
// });

router.get("/", getBooks);
router.post("/", createBook);
router.get("/:id", getBookById);
router.patch("/:id", updateBook);
router.delete("/:id", deleteBook);

export default router;
