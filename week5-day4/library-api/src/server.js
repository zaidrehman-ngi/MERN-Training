import registerProcessErrorHandlers from "./bootstrap/processErrorHandlers.js";
import config from "./config/config.js";
import logger from "./config/logger.js";

registerProcessErrorHandlers();

const { default: app } = await import("./app.js");

app.listen(config.port, () => {
  logger.info(`Server listening on port ${config.port}`);
});
