import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import config from "../config/config.js";
import { tooManyRequests } from "../errors/ApiError.js";

const bookSearchRateLimiter = rateLimit({
  windowMs: config.searchRateLimitWindowMs,
  limit: config.searchRateLimitMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ""),
  handler: (req, res, next) =>
    next(tooManyRequests("Too many book searches. Please try again later.")),
});

export default bookSearchRateLimiter;
