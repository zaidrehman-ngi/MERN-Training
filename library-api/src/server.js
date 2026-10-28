import http from "node:http";
import registerProcessErrorHandlers from "./bootstrap/processErrorHandlers.js";
import config from "./config/config.js";
import logger from "./config/logger.js";

registerProcessErrorHandlers();

const { default: createApp } = await import("./app.js");
const { default: prisma } = await import("./db/prisma.js");
const { default: createRepositories } = await import(
  "./repositories/createRepositories.js"
);
const { default: createServices } = await import(
  "./services/createServices.js"
);
const { default: domainEvents } = await import("./events/domainEvents.js");
const { default: createSocketServer } = await import(
  "./realtime/socketServer.js"
);

// the one place the real database is chosen
const services = createServices(createRepositories(prisma), domainEvents);
const app = createApp(services);

// Express and Socket.IO share one HTTP server, so they share one port
const httpServer = http.createServer(app);
createSocketServer(httpServer, domainEvents, services);

httpServer.listen(config.port, () => {
  logger.info(`Server listening on port ${config.port}`);
});
