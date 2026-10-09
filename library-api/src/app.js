import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import fs from "fs";
import helmet from "helmet";
import cors from "cors";
import db from "../db.json" with { type: "json" };

import requestLog from "./middleware/requestLog.js";
import requestId from "./middleware/requestId.js";
import errorHandler from "./middleware/errorHandler.js";
import apiRateLimiter from "./middleware/apiRateLimiter.js";

import { notFound } from "./errors/ApiError.js";
import config from "./config/config.js";
import logger from "./config/logger.js";

import booksRouter from "./routes/books.routes.js";
import usersRouter from "./routes/users.routes.js";
import borrowRequestsRouter from "./routes/borrowRequests.routes.js";
import authRouter from "./routes/auth.routes.js";

import createRepositories from "./repositories/createRepositories.js";
import createServices from "./services/createServices.js";

const accessLogStream = logger.isEnabled("info")
  ? fs.createWriteStream(config.accessLogPath, { flags: "a" })
  : null;

const app = express();

const repositories = createRepositories(db);
app.locals.services = createServices(repositories);

// 1. Security headers apply to responses from all later middleware and routes.
app.use(helmet());

// 2. Request IDs are available to request logs and centralized error logs.
app.use(requestId);

// 3. Request completion logs include status and duration for every later layer.
app.use(requestLog);

// 4. Morgan logs requests in the environment-appropriate format.
if (logger.isEnabled("info")) {
  // 4a. Write concise development logs or production combined logs to stdout.
  app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));
  // 4b. Keep a combined access-log file for later inspection.
  app.use(morgan("combined", { stream: accessLogStream }));
}

// 5. CORS handles preflight requests and adds CORS headers before later middleware.
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);

// 6. Parse JSON bodies before rate limiting and routes that need request data.
app.use(express.json());

// 7. Parse cookies before routes and middleware that inspect them.
app.use(cookieParser());

// 8. Apply the general API limit after body parsing; route-specific limits run in their routers.
app.use("/api/v1", apiRateLimiter);

// 9. Serve uploaded static files before the remaining application routes.
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

// 10. Register the API root route.
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Library API is running",
  });
});

// 11. Register feature routes after all shared middleware.
// 11a. Book catalogue and search routes.
app.use("/api/v1/books", booksRouter);
// 11b. User routes.
app.use("/api/v1/users", usersRouter);
// 11c. Borrow-request routes.
app.use("/api/v1/borrow-requests", borrowRequestsRouter);
// 11d. Authentication routes.
app.use("/api/v1/auth", authRouter);

// 12. Return not found only after all routes have had a chance to match.
app.use((req) => {
  throw notFound("Route not found.");
});

// 13. Handle errors last so failures from all prior middleware and routes arrive here.
app.use(errorHandler);

export default app;
