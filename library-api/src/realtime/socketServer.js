import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import config from "../config/config.js";
import logger from "../config/logger.js";
import EVENTS, { CLIENT_EVENTS } from "./events.js";
import createPresence from "./presence.js";
import { helloSchema } from "./schemas.js";

// The member id from the token the browser sent in the handshake, or null.
const memberIdFromHandshake = (socket) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return null;
  }
  try {
    return jwt.verify(token, config.jwtSecret).sub;
  } catch {
    return null;
  }
};

const createSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: config.corsOrigin, credentials: true },
  });

  let connectedCount = 0;
  const presence = createPresence();

  const counts = () =>
    `${connectedCount} sockets, ${presence.onlineMemberCount()} members online`;

  // everyone (including a client that just reconnected) gets the real numbers
  const broadcastPresence = () => {
    io.emit(EVENTS.SERVER_PRESENCE_CHANGED, {
      members: presence.onlineMemberCount(),
      sockets: connectedCount,
    });
  };

  io.on("connection", (socket) => {
    connectedCount += 1;
    // socket -> member
    socket.data.memberId = memberIdFromHandshake(socket);
    const who = socket.data.memberId ?? "guest";

    // member -> sockets
    if (socket.data.memberId) {
      presence.add(socket.data.memberId, socket.id);
    }
    logger.info(`Socket connected: ${socket.id} as ${who} (${counts()})`);
    broadcastPresence();

    socket.on("disconnect", (reason) => {
      connectedCount -= 1;
      if (socket.data.memberId) {
        presence.remove(socket.data.memberId, socket.id);
      }
      logger.info(
        `Socket disconnected: ${socket.id} as ${who}, ${reason} (${counts()})`,
      );
      broadcastPresence();
    });

    // a misspelled event from a client would otherwise be ignored silently
    socket.onAny((eventName) => {
      if (!CLIENT_EVENTS.has(eventName)) {
        logger.warn(`Socket ${socket.id} sent an unknown event: ${eventName}`);
      }
    });

    // the three ways to send: only this socket, everyone, everyone else
    socket.on(EVENTS.CLIENT_DEMO_SEND, ({ mode }) => {
      const message = { mode, from: socket.id };
      if (mode === "only-me") {
        socket.emit(EVENTS.SERVER_DEMO_MESSAGE, message);
      } else if (mode === "everyone") {
        io.emit(EVENTS.SERVER_DEMO_MESSAGE, message);
      } else if (mode === "everyone-else") {
        socket.broadcast.emit(EVENTS.SERVER_DEMO_MESSAGE, message);
      }
    });

    socket.on(EVENTS.CLIENT_HELLO, (payload, ack) => {
      const reply = typeof ack === "function" ? ack : () => {};

      // no Express middleware runs for socket events, so check it here
      const result = helloSchema.safeParse(payload);
      if (!result.success) {
        logger.warn(`Socket ${socket.id} sent an invalid ${EVENTS.CLIENT_HELLO}`);
        reply({
          ok: false,
          error: "VALIDATION_ERROR",
          details: result.error.issues.map((issue) => ({
            field: issue.path.join(".") || "payload",
            message: issue.message,
          })),
        });
        return;
      }
      const message = result.data;

      logger.info(`Socket ${socket.id} says: ${message.text}`);
      socket.emit(EVENTS.SERVER_HELLO, {
        text: `Hi, the server got "${message.text}"`,
        at: new Date().toISOString(),
      });

      reply({ ok: true, receivedAt: new Date().toISOString() });
    });
  });

  io.presence = presence;
  return io;
};

export default createSocketServer;
