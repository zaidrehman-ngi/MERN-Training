import config from "./config.js";

const levels = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: Infinity,
};

const isEnabled = (level) => levels[level] >= levels[config.logLevel];

const logger = {
  isEnabled,
  debug: (...args) => {
    if (isEnabled("debug")) console.debug(...args);
  },
  info: (...args) => {
    if (isEnabled("info")) console.info(...args);
  },
  warn: (...args) => {
    if (isEnabled("warn")) console.warn(...args);
  },
  error: (...args) => {
    if (isEnabled("error")) console.error(...args);
  },
};

export default logger;
