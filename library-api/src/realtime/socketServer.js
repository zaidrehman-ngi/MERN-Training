import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import config from "../config/config.js";
import logger from "../config/logger.js";
import EVENTS, { CLIENT_EVENTS, COUNTER_ROOM, bookRoom } from "./events.js";
import createPresence from "./presence.js";
import { DOMAIN_EVENTS } from "../events/domainEvents.js";
import { bookWatchSchema, helloSchema } from "./schemas.js";

const STAFF_ROLES = new Set(["librarian", "admin", "super admin"]);

// The member from the token the browser sent in the handshake, or null.
const memberFromHandshake = (socket) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return null;
  }
  try {
    const { sub, role } = jwt.verify(token, config.jwtSecret);
    return { id: sub, role };
  } catch {
    return null;
  }
};

// Checks a payload against a zod schema. On failure it answers through the
// ack (if there is one) and returns null, so the handler can just stop.
const parsePayload = (schema, payload, reply) => {
  const result = schema.safeParse(payload);
  if (result.success) {
    return result.data;
  }
  reply({
    ok: false,
    error: "VALIDATION_ERROR",
    details: result.error.issues.map((issue) => ({
      field: issue.path.join(".") || "payload",
      message: issue.message,
    })),
  });
  return null;
};

const ackOf = (ack) => (typeof ack === "function" ? ack : () => {});

const createSocketServer = (httpServer, domainEvents) => {
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
    const member = memberFromHandshake(socket);
    socket.data.memberId = member?.id ?? null;
    const who = socket.data.memberId ?? "guest";

    if (member && STAFF_ROLES.has(member.role)) {
      socket.join(COUNTER_ROOM);
    }

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

    socket.on(EVENTS.CLIENT_BOOK_WATCH, (payload, ack) => {
      const reply = ackOf(ack);
      const data = parsePayload(bookWatchSchema, payload, reply);
      if (!data) return;
      socket.join(bookRoom(data.bookId));
      logger.info(`Socket ${socket.id} is watching ${data.bookId}`);
      reply({ ok: true });
    });

    socket.on(EVENTS.CLIENT_BOOK_UNWATCH, (payload, ack) => {
      const reply = ackOf(ack);
      const data = parsePayload(bookWatchSchema, payload, reply);
      if (!data) return;
      socket.leave(bookRoom(data.bookId));
      logger.info(`Socket ${socket.id} stopped watching ${data.bookId}`);
      reply({ ok: true });
    });

    socket.on(EVENTS.CLIENT_HELLO, (payload, ack) => {
      const reply = ackOf(ack);
      // no Express middleware runs for socket events, so check it here
      const message = parsePayload(helloSchema, payload, reply);
      if (!message) {
        logger.warn(`Socket ${socket.id} sent an invalid ${EVENTS.CLIENT_HELLO}`);
        return;
      }

      logger.info(`Socket ${socket.id} says: ${message.text}`);
      socket.emit(EVENTS.SERVER_HELLO, {
        text: `Hi, the server got "${message.text}"`,
        at: new Date().toISOString(),
      });

      reply({ ok: true, receivedAt: new Date().toISOString() });
    });
  });

  // the one place availability becomes a socket message
  domainEvents.on(
    DOMAIN_EVENTS.BOOK_AVAILABILITY_CHANGED,
    ({ bookId, available }) => {
      io.to(bookRoom(bookId)).emit(EVENTS.SERVER_BOOK_AVAILABILITY_CHANGED, {
        bookId,
        available,
      });
    },
  );

  domainEvents.on(DOMAIN_EVENTS.BORROW_REQUEST_CREATED, (request) => {
    io.to(COUNTER_ROOM).emit(EVENTS.SERVER_BORROW_REQUEST_CREATED, {
      id: request.id,
      bookTitle: request.book.title,
      memberName: request.member.name,
      requestedAt: request.requestedAt,
    });
  });

  io.presence = presence;
  return io;
};

export default createSocketServer;
