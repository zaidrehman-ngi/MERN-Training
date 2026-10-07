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
import morgan from "morgan";
import fs from "fs";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import validate from "./middleware/validate.js";
import { filenameSchema } from "./schemas/files.schema.js";
import { notFound } from "./errors/ApiError.js";
import config from "./config/config.js";
import logger from "./config/logger.js";
import apiRateLimiter from "./middleware/apiRateLimiter.js";

const accessLogStream = logger.isEnabled("info")
  ? fs.createWriteStream("./logs/access.log", { flags: "a" })
  : null;

const app = express();

// Security headers must be added early so they apply to responses from the rest of the app.
app.use(helmet());

app.use(requestId);

// Logging should run early so requests to all following middleware and routes are recorded.
app.use(requestLog);

if (logger.isEnabled("info")) {
  app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));
  app.use(morgan("combined", { stream: accessLogStream }));
}

// CORS must run before routes so the required CORS headers are added to API responses.
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);

// Body parsing must run before routes that need to read JSON request bodies.
app.use(express.json());

// Cookie parsing must run before routes or middleware that need to read cookies.
app.use(cookieParser());

app.locals.db = db;

app.use("/api/v1", apiRateLimiter);

// Static files are served before API routes so requests for uploads are handled directly.
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(config.uploadsPath, {
    maxAge: "1h",
  }),
);

app.get(
  "/files/:filename",
  validate(filenameSchema, "params"),
  (req, res, next) => {
    const requestedPath = path.resolve(config.uploadsPath, req.params.filename);

    if (
      requestedPath !== config.uploadsPath &&
      !requestedPath.startsWith(`${config.uploadsPath}${path.sep}`)
    ) {
      throw notFound("File not found.");
    }

    const stream = fs.createReadStream(requestedPath);

    res.setHeader("Content-Type", "image/jpeg");

    stream.on("error", (error) => {
      if (error.code === "ENOENT") {
        next(notFound("File not found."));
        return;
      }

      next(error);
    });
    stream.pipe(res);
  },
);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Library API is running",
  });
});

// API routes come after the common middleware they depend on.
app.use("/api/v1/books", booksRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/borrow-requests", borrowRequestsRouter);
app.use("/api/v1/auth", authRouter);

// Task 4 verification: this was enabled temporarily to test thrown strings.
// app.get("/exercise-error-string", () => {
//   throw "a plain string";
// });
//
// app.get("/b", async () => {
//   throw new Error("boom");
// });
//
// const somethingAsync = () => Promise.reject(new Error("async rejection"));
// app.get("/c", (req, res) => {
//   somethingAsync();
//   res.json({ ok: true });
// });

// 404 must come after the routes so it only handles requests that matched nothing.
app.use((req) => {
  throw notFound("Route not found.");
});

// Error handling must come last so errors from middleware and routes reach it.
app.use(errorHandler);

export default app;
