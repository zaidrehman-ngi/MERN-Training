import express from "express";
import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/books.controller.js";

const router = express.Router();

router.get("/", getBooks);
router.post("/", createBook);

// router.get("/new", (req, res) => {
//   res.send("New book form");
// });

router.get("/:id", getBookById);
router.patch("/:id", updateBook);
router.delete("/:id", deleteBook);

export default router;
