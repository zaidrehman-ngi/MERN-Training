import { z } from "zod";
import cron from "node-cron";

type DurationUnit = "ms" | "s" | "m" | "h" | "d" | "w";

const millisecondsByUnit: Record<DurationUnit, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
};

// "15m" -> 900000, or null if it isn't a duration
export const durationToMs = (value: string): number | null => {
  const match = value.match(/^(\d+)(ms|s|m|h|d|w)$/);
  if (!match) {
    return null;
  }
  const [, amount, unit] = match;
  return Number(amount) * millisecondsByUnit[unit as DurationUnit];
};

const duration = z
  .string()
  .regex(/^[1-9]\d*(ms|s|m|h|d|w)$/, "must be a duration such as 15m or 1h")
  .refine((expiry) => {
    const ms = durationToMs(expiry);
    return ms !== null && Number.isSafeInteger(ms);
  }, "must be a supported duration");

const configSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535),
  DATABASE_URL: z
    .string()
    .regex(/^postgres(ql)?:\/\//, "must be a postgresql:// connection string"),
  JWT_SECRET: z
    .string()
    .min(32, "must be at least 32 characters long")
    .refine(
      (secret) => !secret.toLowerCase().includes("replace-with"),
      "must not be a placeholder value",
    ),
  JWT_EXPIRES_IN: duration,
  JWT_REFRESH_EXPIRES_IN: duration.default("7d"),
  CORS_ORIGIN: z
    .url()
    .refine((origin) => /^https?:\/\//i.test(origin), "must use http or https"),
  ACCESS_LOG_PATH: z.string().trim().min(1).default("logs/access.log"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive(),
  RATE_LIMIT_MAX: z.coerce.number().int().positive(),
  LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive(),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive(),
  SEARCH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive(),
  SEARCH_RATE_LIMIT_MAX: z.coerce.number().int().positive(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "silent"]),
  DB_QUERY_LOG: z.enum(["true", "false"]).default("false"),
  // bcrypt cost factor: below 10 is too fast to guess, above 15 makes login very slow
  BCRYPT_COST: z.coerce.number().int().min(10).max(15).default(12),
  LOAN_PERIOD_DAYS: z.coerce.number().int().positive().default(14),
  FINE_PER_DAY: z.coerce.number().int().nonnegative().default(20),
  FINE_MAX_DAYS: z.coerce.number().int().positive().default(30),
  HOLD_DAYS: z.coerce.number().int().positive().default(3),
  LIBRARY_TIME_ZONE: z
    .string()
    .default("Asia/Karachi")
    .refine((zone) => {
      try {
        new Intl.DateTimeFormat("en-CA", { timeZone: zone });
        return true;
      } catch {
        return false;
      }
    }, "must be an IANA time zone such as Asia/Karachi"),
  ALLOW_SEED: z.enum(["true", "false"]).default("false"),
  HOLD_EXPIRY_SCHEDULE: z
    .string()
    .default("5 0 * * *")
    .refine(
      (expression) => cron.validate(expression),
      "must be a cron expression",
    ),
  DUE_REMINDER_SCHEDULE: z
    .string()
    .default("0 8 * * *")
    .refine(
      (expression) => cron.validate(expression),
      "must be a cron expression",
    ),
});

export default configSchema;
