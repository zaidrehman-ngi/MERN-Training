import { z } from "zod";

const millisecondsByUnit = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
};

const configSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535),
  JWT_SECRET: z
    .string()
    .min(32, "must be at least 32 characters long")
    .refine(
      (secret) => !secret.toLowerCase().includes("replace-with"),
      "must not be a placeholder value",
    ),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^[1-9]\d*(ms|s|m|h|d|w)$/, "must be a duration such as 15m or 1h")
    .refine((expiry) => {
      const match = expiry.match(/^(\d+)(ms|s|m|h|d|w)$/);
      if (!match) {
        return false;
      }

      const [, amount, unit] = match;
      return Number.isSafeInteger(Number(amount) * millisecondsByUnit[unit]);
    }, "must be a supported duration"),
  CORS_ORIGIN: z
    .url()
    .refine((origin) => /^https?:\/\//i.test(origin), "must use http or https"),
  UPLOADS_PATH: z.string().trim().min(1),
  ACCESS_LOG_PATH: z.string().trim().min(1).default("logs/access.log"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive(),
  RATE_LIMIT_MAX: z.coerce.number().int().positive(),
  LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive(),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive(),
  SEARCH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive(),
  SEARCH_RATE_LIMIT_MAX: z.coerce.number().int().positive(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "silent"]),
});

export default configSchema;
