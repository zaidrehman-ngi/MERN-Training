import { inspect } from "node:util";
import { writeSync } from "node:fs";

let isExiting = false;

const exitAfterFatalError = (eventName, error) => {
  if (isExiting) {
    return;
  }

  isExiting = true;

  try {
    writeSync(2, `[FATAL] ${eventName}: ${inspect(error, { depth: 5 })}\n`);
  } finally {
    process.exit(1);
  }
};

const registerProcessErrorHandlers = () => {
  process.on("unhandledRejection", (reason) => {
    exitAfterFatalError("unhandledRejection", reason);
  });

  process.on("uncaughtException", (error) => {
    exitAfterFatalError("uncaughtException", error);
  });
};

export default registerProcessErrorHandlers;
