import http from "node:http";
import registerProcessErrorHandlers from "./bootstrap/processErrorHandlers.ts";
import config from "./config/config.ts";
import logger from "./config/logger.ts";

registerProcessErrorHandlers();

const { default: createApp } = await import("./app.ts");
const { default: prisma } = await import("./db/prisma.ts");
const { default: createRepositories } =
  await import("./repositories/createRepositories.ts");
const { default: createServices } =
  await import("./services/createServices.ts");
const { default: domainEvents } = await import("./events/domainEvents.ts");
const { default: createSocketServer } =
  await import("./realtime/socketServer.ts");
const { startJobs } = await import("./jobs/scheduler.ts");

const services = createServices(createRepositories(prisma), domainEvents);
const app = createApp(services);

// Express and Socket.IO share one HTTP server, so they share one port
const httpServer = http.createServer(app);
createSocketServer(httpServer, domainEvents, services);

httpServer.listen(config.port, () => {
  logger.info(`Server listening on port ${config.port}`);
  startJobs(services);
});
