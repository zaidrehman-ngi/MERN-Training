import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import fs from "fs";
import helmet from "helmet";
import cors from "cors";

import requestLog from "./middleware/requestLog.ts";
import requestId from "./middleware/requestId.ts";
import errorHandler from "./middleware/errorHandler.ts";
import apiRateLimiter from "./middleware/apiRateLimiter.ts";

import { notFound } from "./errors/ApiError.ts";
import config from "./config/config.ts";
import logger from "./config/logger.ts";

import booksRouter from "./routes/books.routes.ts";
import usersRouter from "./routes/users.routes.ts";
import borrowRequestsRouter from "./routes/borrowRequests.routes.ts";
import authRouter from "./routes/auth.routes.ts";
import jobsRouter from "./routes/jobs.routes.ts";
import type { Services } from "./services/createServices.ts";

const accessLogStream = logger.isEnabled("info")
  ? fs.createWriteStream(config.accessLogPath, { flags: "a" })
  : null;

// services come from outside, so the caller picks the real or a fake database
const createApp = (services: Services) => {
  const app = express();
  app.locals.services = services;

  app.use(helmet());
  app.use(requestId);
  app.use(requestLog);

  if (accessLogStream) {
    app.use(morgan("combined", { stream: accessLogStream }));
  }

  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    }),
  );

  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/v1", apiRateLimiter);

  app.get("/", (req, res) => {
    res.status(200).json({
      message: "Library API is running",
    });
  });

  app.use("/api/v1/books", booksRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/borrow-requests", borrowRequestsRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/jobs", jobsRouter);

  app.use((req) => {
    throw notFound("Route not found.");
  });

  app.use(errorHandler);

  return app;
};

export default createApp;
