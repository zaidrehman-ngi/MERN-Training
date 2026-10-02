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

// router.post("/", (req, res) => {
//   console.log(req.body);
//   res.json(req.body);
// });

// router.post("/", (req, res) => {
//   const book = {
//     title: "Dune",
//     author: "Frank Herbert",
//   };

//   res.end(book);
// });

// router.post("/", (req, res) => {
//   res.send(["Dune", "Foundation", "1984"]);
// });

// router.get("/new", (req, res) => {
//   res.send("New book form");
// });

// router.post("/", (req, res) => {
//   res.json({
//     message: "First response",
//   });

//   res.json({
//     message: "Second response",
//   });
// });

// router.post("/", (req, res) => {
//   res.json({
//     message: "Response sent",
//   });

//   console.log("Doing more work...");
// });

router.get("/:id", getBookById);
router.patch("/:id", updateBook);
router.delete("/:id", deleteBook);

export default router;
