import { Server } from "socket.io";
import config from "../config/config.js";
import logger from "../config/logger.js";
import EVENTS, { CLIENT_EVENTS } from "./events.js";

const createSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: config.corsOrigin, credentials: true },
  });

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // a misspelled event from a client would otherwise be ignored silently
    socket.onAny((eventName) => {
      if (!CLIENT_EVENTS.has(eventName)) {
        logger.warn(`Socket ${socket.id} sent an unknown event: ${eventName}`);
      }
    });

    socket.on(EVENTS.CLIENT_HELLO, (message, ack) => {
      logger.info(`Socket ${socket.id} says: ${message.text}`);
      socket.emit(EVENTS.SERVER_HELLO, {
        text: `Hi, the server got "${message.text}"`,
        at: new Date().toISOString(),
      });

      // the client only passes ack if it wants an answer
      if (typeof ack === "function") {
        ack({ ok: true, receivedAt: new Date().toISOString() });
      }
    });
  });

  return io;
};

export default createSocketServer;
