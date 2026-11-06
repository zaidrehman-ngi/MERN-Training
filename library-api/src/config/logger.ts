import config from "./config.ts";

type Level = "debug" | "info" | "warn" | "error" | "silent";

const levels: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: Infinity,
};

const isEnabled = (level: Level) => levels[level] >= levels[config.logLevel];

const logger = {
  isEnabled,
  debug: (...args: unknown[]) => {
    if (isEnabled("debug")) console.debug(...args);
  },
  info: (...args: unknown[]) => {
    if (isEnabled("info")) console.info(...args);
  },
  warn: (...args: unknown[]) => {
    if (isEnabled("warn")) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (isEnabled("error")) console.error(...args);
  },
};

export default logger;
