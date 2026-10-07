import { ApiError } from "../errors/ApiError.js";

const createSlidingWindowLimiter = ({
  windowMs,
  limit,
  keyGenerator,
  countFailedResponses = false,
  skip,
  message,
}) => {
  const requestsByKey = new Map();
  const cleanupTimer = setInterval(
    () => {
      const cutoff = Date.now() - windowMs;
      for (const [key, records] of requestsByKey) {
        const activeRecords = records.filter((record) => record.at > cutoff);
        if (activeRecords.length === 0) {
          requestsByKey.delete(key);
        } else {
          requestsByKey.set(key, activeRecords);
        }
      }
    },
    Math.min(windowMs, 60_000),
  );
  cleanupTimer.unref();

  return (req, res, next) => {
    if (skip?.(req)) {
      next();
      return;
    }

    const key = keyGenerator(req);
    const now = Date.now();
    const cutoff = now - windowMs;
    const records = (requestsByKey.get(key) || []).filter(
      (record) => record.at > cutoff,
    );
    requestsByKey.set(key, records);

    const retryAfterMs =
      records.length >= limit ? records[0].at + windowMs - now : 0;
    const remaining = Math.max(0, limit - records.length);
    res.setHeader("RateLimit-Limit", String(limit));
    res.setHeader("RateLimit-Remaining", String(remaining));

    if (retryAfterMs > 0) {
      const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.setHeader("RateLimit-Reset", String(retryAfterSeconds));
      next(
        new ApiError(message, 429, {
          code: "RATE_LIMIT_EXCEEDED",
        }),
      );
      return;
    }

    if (!countFailedResponses) {
      records.push({ at: now });
      res.setHeader(
        "RateLimit-Remaining",
        String(Math.max(0, limit - records.length)),
      );
      requestsByKey.set(key, records);
      next();
      return;
    }

    const attempt = { at: now };
    records.push(attempt);
    requestsByKey.set(key, records);
    res.setHeader(
      "RateLimit-Remaining",
      String(Math.max(0, limit - records.length)),
    );
    res.once("finish", () => {
      if (res.statusCode !== 401) {
        requestsByKey.set(
          key,
          (requestsByKey.get(key) || []).filter((record) => record !== attempt),
        );
        return;
      }

      attempt.at = Date.now();
    });
    next();
  };
};

export default createSlidingWindowLimiter;
