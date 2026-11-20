import { rateLimit } from "express-rate-limit";
import clientIpKey from "../utils/clientIp.ts";
import config from "../config/config.ts";
import { tooManyRequests } from "../errors/ApiError.ts";

const bookSearchRateLimiter = rateLimit({
  windowMs: config.searchRateLimitWindowMs,
  limit: config.searchRateLimitMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: clientIpKey,
  handler: (req, res, next) =>
    next(tooManyRequests("Too many book searches. Please try again later.")),
});

export default bookSearchRateLimiter;
