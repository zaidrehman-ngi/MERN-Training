import "dotenv/config";
import path from "node:path";
import configSchema from "./config.schema.js";

const millisecondsByUnit = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
};

const result = configSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  UPLOADS_PATH: process.env.UPLOADS_PATH,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
  LOGIN_RATE_LIMIT_WINDOW_MS: process.env.LOGIN_RATE_LIMIT_WINDOW_MS,
  LOGIN_RATE_LIMIT_MAX: process.env.LOGIN_RATE_LIMIT_MAX,
  SEARCH_RATE_LIMIT_WINDOW_MS: process.env.SEARCH_RATE_LIMIT_WINDOW_MS,
  SEARCH_RATE_LIMIT_MAX: process.env.SEARCH_RATE_LIMIT_MAX,
  LOG_LEVEL: process.env.LOG_LEVEL,
});

if (!result.success) {
  const issues = result.error.issues.map((issue) => {
    const variable = issue.path[0] || "CONFIGURATION";
    return `${variable}: ${issue.message}`;
  });
  console.error(`Invalid environment configuration:\n${issues.join("\n")}`);
  process.exit(1);
}

const values = result.data;
const expiryParts = values.JWT_EXPIRES_IN.match(/^(\d+)(ms|s|m|h|d|w)$/);

const config = Object.freeze({
  nodeEnv: values.NODE_ENV,
  port: values.PORT,
  jwtSecret: values.JWT_SECRET,
  jwtExpiresIn: values.JWT_EXPIRES_IN,
  jwtExpiresInMs: Number(expiryParts[1]) * millisecondsByUnit[expiryParts[2]],
  corsOrigin: values.CORS_ORIGIN,
  uploadsPath: path.resolve(process.cwd(), values.UPLOADS_PATH),
  rateLimitWindowMs: values.RATE_LIMIT_WINDOW_MS,
  rateLimitMax: values.RATE_LIMIT_MAX,
  loginRateLimitWindowMs: values.LOGIN_RATE_LIMIT_WINDOW_MS,
  loginRateLimitMax: values.LOGIN_RATE_LIMIT_MAX,
  searchRateLimitWindowMs: values.SEARCH_RATE_LIMIT_WINDOW_MS,
  searchRateLimitMax: values.SEARCH_RATE_LIMIT_MAX,
  logLevel: values.LOG_LEVEL,
});

export default config;
