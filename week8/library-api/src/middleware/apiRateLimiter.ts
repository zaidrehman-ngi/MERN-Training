import { rateLimit } from "express-rate-limit";
import clientIpKey from "../utils/clientIp.ts";
import config from "../config/config.ts";
import { tooManyRequests } from "../errors/ApiError.ts";

const apiRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  limit: config.rateLimitMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: clientIpKey,
  handler: (req, res, next) => next(tooManyRequests()),
  // login and book search have their own limiters
  skip: (req) =>
    (req.method === "POST" && req.path === "/auth/login") ||
    (req.method === "GET" && req.path === "/books"),
});

export default apiRateLimiter;
