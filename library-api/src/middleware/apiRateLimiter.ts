import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import config from "../config/config.ts";
import { tooManyRequests } from "../errors/ApiError.ts";

const apiRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  limit: config.rateLimitMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ""),
  handler: (req, res, next) => next(tooManyRequests()),
  // login and book search have their own limiters
  skip: (req) =>
    (req.method === "POST" && req.path === "/auth/login") ||
    (req.method === "GET" && req.path === "/books"),
});

export default apiRateLimiter;
