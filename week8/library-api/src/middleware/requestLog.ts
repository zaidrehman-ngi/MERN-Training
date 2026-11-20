import type { RequestHandler } from "express";
import logger from "../config/logger.ts";

const requestLog: RequestHandler = (req, res, next) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.info(
      `${req.requestId} ${req.method} ${req.path} ${res.statusCode} ${duration}ms`,
    );
  });

  next();
};

export default requestLog;
