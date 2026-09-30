import express from "express";
import booksRouter from "./routes/books.routes.js";
import usersRouter from "./routes/users.routes.js";
import borrowRequestsRouter from "./routes/borrowRequests.routes.js";
import authRouter from "./routes/auth.routes.js";
import db from "../db.json" with { type: "json" };

const app = express();

app.use(express.json());

app.locals.db = db;

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Library API is running",
  });
});

app.use("/api/v1/books", booksRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/borrow-requests", borrowRequestsRouter);
app.use("/api/v1/auth", authRouter);

app.use((req, res) => {
  res.status(404).json({
    error: "NOT_FOUND",
    message: "Route not found.",
    details: [],
  });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
