import express from "express";
import booksRouter from "./routes/books.routes.js";
import usersRouter from "./routes/users.routes.js";
import borrowRequestsRouter from "./routes/borrowRequests.routes.js";
import authRouter from "./routes/auth.routes.js";
import db from "../db.json" with { type: "json" };
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.locals.db = db;

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Library API is running",
  });
});

// app.get("/catalogue", (req, res) => {
//   res.redirect(301, "/books");
// });

app.get("/catalogue", (req, res) => {
  res.redirect(301, "/users");
});

// app.get("/catalogue-302", (req, res) => {
//   res.redirect(302, "/books");
// });

app.get("/catalogue-302", (req, res) => {
  res.redirect(302, "/users");
});

app.get("/a", (req, res) => {
  res.redirect(302, "/b");
});

app.get("/b", (req, res) => {
  res.redirect(302, "/a");
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
