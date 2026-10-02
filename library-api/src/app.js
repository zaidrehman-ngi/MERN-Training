import "dotenv/config";
import express from "express";
import booksRouter from "./routes/books.routes.js";
import usersRouter from "./routes/users.routes.js";
import borrowRequestsRouter from "./routes/borrowRequests.routes.js";
import authRouter from "./routes/auth.routes.js";
import db from "../db.json" with { type: "json" };
import cookieParser from "cookie-parser";
import requestLog from "./middleware/requestLog.js";
import requestId from "./middleware/requestId.js";
import errorHandler from "./middleware/errorHandler.js";
import requireAuth from "./middleware/requireAuth.js";
import morgan from "morgan";
import fs from "fs";
import helmet from "helmet";
import cors from "cors";

const accessLogStream = fs.createWriteStream("./logs/access.log", {
  flags: "a",
});

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

// app.use(
//   cors({
//     origin: "*",
//     credentials: true,
//   }),
// );

app.use(requestLog);

// app.use(morgan("dev"));
app.use(morgan("combined"));
app.use(morgan("combined", { stream: accessLogStream }));

app.use(helmet());
// app.use(requestId);

app.use(express.json());
app.use(cookieParser());

app.locals.db = db;

// app.use((req, res, next) => {
//   console.log("A");
//   next();
// });

// app.use((req, res, next) => {
//   console.log("B");
//   next();
// });

// app.use((req, res, next) => {
//   console.log("C");
//   next();
// });

// app.get("/middleware-test", (req, res) => {
//   console.log("D");
//   res.json({
//     message: "Middleware test passed",
//   });
// });

// app.use("/api/v1", (req, res, next) => {
//   console.log("API-V1:", req.method, req.path);
//   next();
// });

// app.get("/", (req, res, next) => {
//   console.log("SINGLE ROUTE:", req.method, req.path);
//   next();
// }, (req, res) => {
//   res.status(200).json({
//     message: "Library API is running",
//   });
// });

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Library API is running",
  });
});

// app.get("/error-next", (req, res, next) => {
//   next(new Error("Deliberate next error"));
// });

// app.get("/error-async", async (req, res) => {
//   throw new Error("Deliberate async error");
// });

// app.get("/auth-test", requireAuth, (req, res) => {
//   res.json({
//     message: "Authenticated",
//     user: req.user,
//   });
// });

app.use("/api/v1/books", booksRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/borrow-requests", borrowRequestsRouter);
app.use("/api/v1/auth", authRouter);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({
    error: "NOT_FOUND",
    message: "Route not found.",
    details: [],
  });
});

export default app;
