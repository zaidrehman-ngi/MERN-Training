import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import config from "../config/config.js";
import { ApiError } from "../errors/ApiError.js";

const bookSearchRateLimiter = rateLimit({
  windowMs: config.searchRateLimitWindowMs,
  limit: config.searchRateLimitMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.user?.sub ? `user:${req.user.sub}` : `ip:${ipKeyGenerator(req.ip)}`,
  handler: (req, res, next) => {
    next(
      new ApiError("Too many book searches. Please try again later.", 429, {
        code: "RATE_LIMIT_EXCEEDED",
      }),
    );
  },
});

export default bookSearchRateLimiter;
