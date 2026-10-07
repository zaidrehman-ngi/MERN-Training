import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import config from "../config/config.js";
import { ApiError } from "../errors/ApiError.js";

const apiRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  limit: config.rateLimitMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  handler: (req, res, next) => {
    next(
      new ApiError("Too many requests. Please try again later.", 429, {
        code: "RATE_LIMIT_EXCEEDED",
      }),
    );
  },
  skip: (req) =>
    (req.method === "POST" && req.path === "/auth/login") ||
    (req.method === "GET" && req.path === "/books"),
});

export default apiRateLimiter;
