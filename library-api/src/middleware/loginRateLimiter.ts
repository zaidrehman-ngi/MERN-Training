import type { Request, RequestHandler } from "express";
import { ipKeyGenerator } from "express-rate-limit";
import config from "../config/config.js";
import { tooManyRequests } from "../errors/ApiError.ts";

const windowMs = config.loginRateLimitWindowMs;
const limit = config.loginRateLimitMax;

type Attempt = { at: number };

// failed logins per email + IP, inside a sliding window
const failedAttempts = new Map<string, Attempt[]>();

const keyFor = (req: Request) => {
  const email: unknown = req.body?.email;
  const account = typeof email === "string" ? email.trim().toLowerCase() : "";
  return `${account}\u0000${ipKeyGenerator(req.ip ?? "")}`;
};

const recentAttempts = (key: string, now: number) =>
  (failedAttempts.get(key) ?? []).filter((a) => a.at > now - windowMs);

setInterval(
  () => {
    const now = Date.now();
    for (const key of failedAttempts.keys()) {
      const recent = recentAttempts(key, now);
      if (recent.length === 0) {
        failedAttempts.delete(key);
      } else {
        failedAttempts.set(key, recent);
      }
    }
  },
  Math.min(windowMs, 60_000),
).unref();

const loginRateLimiter: RequestHandler = (req, res, next) => {
  const key = keyFor(req);
  const now = Date.now();
  const attempts = recentAttempts(key, now);
  failedAttempts.set(key, attempts);
  res.setHeader("RateLimit-Limit", String(limit));

  const oldest = attempts[0];
  if (attempts.length >= limit && oldest) {
    const retryAfter = String(
      Math.max(1, Math.ceil((oldest.at + windowMs - now) / 1000)),
    );
    res.setHeader("RateLimit-Remaining", "0");
    res.setHeader("Retry-After", retryAfter);
    res.setHeader("RateLimit-Reset", retryAfter);
    next(
      tooManyRequests(
        "Too many failed login attempts. Please try again later.",
      ),
    );
    return;
  }

  // counted up front so parallel guesses are limited too; dropped if the login works
  const attempt: Attempt = { at: now };
  attempts.push(attempt);
  res.setHeader("RateLimit-Remaining", String(limit - attempts.length));
  res.once("finish", () => {
    if (res.statusCode === 401) {
      attempt.at = Date.now();
      return;
    }
    failedAttempts.set(
      key,
      (failedAttempts.get(key) ?? []).filter((a) => a !== attempt),
    );
  });
  next();
};

export default loginRateLimiter;
