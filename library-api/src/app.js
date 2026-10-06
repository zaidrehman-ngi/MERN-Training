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
import path from "path";
import helmet from "helmet";
import cors from "cors";

const accessLogStream = fs.createWriteStream("./logs/access.log", {
  flags: "a",
});

const app = express();

// Security headers must be added early so they apply to responses from the rest of the app.
app.use(helmet());

// app.use(requestId);

// Logging should run early so requests to all following middleware and routes are recorded.
app.use(requestLog);

// app.use(morgan("dev"));
app.use(morgan("combined"));
app.use(morgan("combined", { stream: accessLogStream }));

// CORS must run before routes so the required CORS headers are added to API responses.
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

// Body parsing must run before routes that need to read JSON request bodies.
app.use(express.json());

// Cookie parsing must run before routes or middleware that need to read cookies.
app.use(cookieParser());

app.locals.db = db;

// Static files are served before API routes so requests for uploads are handled directly.
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static("uploads", {
    maxAge: "1h",
  }),
);

app.get("/files/:filename", (req, res) => {
  const uploadsPath = path.resolve("uploads");
  const requestedPath = path.resolve(uploadsPath, req.params.filename);

  if (
    requestedPath !== uploadsPath &&
    !requestedPath.startsWith(`${uploadsPath}${path.sep}`)
  ) {
    return res.status(404).json({
      error: "NOT_FOUND",
      message: "File not found.",
      details: [],
    });
  }

  const stream = fs.createReadStream(requestedPath);

  res.setHeader("Content-Type", "image/jpeg");

  stream.pipe(res);
});

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

// API routes come after the common middleware they depend on.
app.use("/api/v1/books", booksRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/borrow-requests", borrowRequestsRouter);
app.use("/api/v1/auth", authRouter);

// 404 must come after the routes so it only handles requests that matched nothing.
app.use((req, res) => {
  res.status(404).json({
    error: "NOT_FOUND",
    message: "Route not found.",
    details: [],
  });
});

// Error handling must come last so errors from middleware and routes reach it.
app.use(errorHandler);

export default app;
