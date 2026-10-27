import http from "node:http";
import registerProcessErrorHandlers from "./bootstrap/processErrorHandlers.js";
import config from "./config/config.js";
import logger from "./config/logger.js";

registerProcessErrorHandlers();

const { default: app } = await import("./app.js");
const { default: domainEvents } = await import("./events/domainEvents.js");
const { default: createSocketServer } = await import(
  "./realtime/socketServer.js"
);

// Express and Socket.IO share one HTTP server, so they share one port
const httpServer = http.createServer(app);
createSocketServer(httpServer, domainEvents, app.locals.services);

httpServer.listen(config.port, () => {
  logger.info(`Server listening on port ${config.port}`);
});
