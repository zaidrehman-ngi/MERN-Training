import { ipKeyGenerator } from "express-rate-limit";
import config from "../config/config.js";
import createSlidingWindowLimiter from "./createSlidingWindowLimiter.js";

const loginRateLimiter = createSlidingWindowLimiter({
  windowMs: config.loginRateLimitWindowMs,
  limit: config.loginRateLimitMax,
  countFailedResponses: true,
  keyGenerator: (req) => {
    const email = req.body?.email;
    const account = typeof email === "string" ? email.trim().toLowerCase() : "";
    return `${account}\u0000${ipKeyGenerator(req.ip)}`;
  },
  message: "Too many failed login attempts. Please try again later.",
});

export default loginRateLimiter;
