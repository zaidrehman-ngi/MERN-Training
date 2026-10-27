import { Server } from "socket.io";
import config from "../config/config.js";
import logger from "../config/logger.js";
import EVENTS, { CLIENT_EVENTS, COUNTER_ROOM, bookRoom } from "./events.js";
import createPresence from "./presence.js";
import { DOMAIN_EVENTS } from "../events/domainEvents.js";
import {
  bookWatchSchema,
  decideRequestSchema,
  demoSendSchema,
  helloSchema,
} from "./schemas.js";
import { forbidden } from "../errors/ApiError.js";

const STAFF_ROLES = new Set(["librarian", "admin", "super admin"]);
// same roles as PATCH /borrow-requests/:id
const DECIDE_ROLES = ["librarian", "admin"];

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

const createSocketServer = (httpServer, domainEvents, services) => {
  const io = new Server(httpServer, {
    cors: { origin: config.corsOrigin, credentials: true },
  });

  // Runs once per connection, before "connection". Same token check as
  // requireAuth; if it fails the socket is never connected.
  io.use(async (socket, next) => {
    try {
      const { member, exp } = await services.auth.verifyAccessToken(
        socket.handshake.auth?.token,
      );
      socket.data.member = member;
      socket.data.tokenExp = exp;
      next();
    } catch (err) {
      logger.warn(`Socket rejected: ${err.message}`);
      // the client gets this as a connect_error
      const error = new Error(err.statusCode === 401 ? err.message : "Server error.");
      error.data = { code: err.code ?? "INTERNAL_ERROR" };
      next(error);
    }
  });

  // For privileged events: the token is checked again (it may have expired
  // or been logged out since the handshake) and the role is read again from
  // the database, so a librarian who was demoted can't keep approving.
  const authorise = async (socket, roles) => {
    const { member } = await services.auth.verifyAccessToken(
      socket.handshake.auth?.token,
    );
    if (!roles.includes(member.role)) {
      throw forbidden("You do not have permission to perform this action.");
    }
    return member;
  };

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
    // every socket here got through io.use, so it has a member
    const { member } = socket.data;

    if (STAFF_ROLES.has(member.role)) {
      socket.join(COUNTER_ROOM);
    }

    // member -> sockets
    presence.add(member.id, socket.id);
    logger.info(`Socket connected: ${socket.id} as ${member.id} (${counts()})`);
    broadcastPresence();

    // the token stops being valid at exp, so the socket does too; the client
    // refreshes its token and reconnects (see decisions.md)
    const expiryTimer = setTimeout(() => {
      logger.info(`Socket ${socket.id} token expired, disconnecting`);
      socket.emit(EVENTS.SERVER_SESSION_EXPIRED);
      socket.disconnect(true);
    }, socket.data.tokenExp * 1000 - Date.now());

    socket.on("disconnect", (reason) => {
      clearTimeout(expiryTimer);
      connectedCount -= 1;
      presence.remove(member.id, socket.id);
      logger.info(
        `Socket disconnected: ${socket.id} as ${member.id}, ${reason} (${counts()})`,
      );
      broadcastPresence();
    });

    // Socket events have no errorHandler behind them like routes do: a throw
    // in a handler would be an uncaughtException and stop the whole API. So
    // every handler goes through here, and errors become a failed ack.
    const on = (eventName, handler) => {
      socket.on(eventName, async (payload, ack) => {
        const reply = ackOf(ack);
        try {
          await handler(payload, reply);
        } catch (err) {
          const known = err.isOperational === true;
          if (known) {
            logger.warn(`Socket ${socket.id} ${eventName} refused: ${err.message}`);
          } else {
            logger.error(`Socket ${socket.id} ${eventName} failed: ${err.stack}`);
          }
          reply({
            ok: false,
            error: err.code ?? "INTERNAL_ERROR",
            message: known ? err.message : "Something went wrong.",
          });
          // the token is no good any more, the client has to reconnect with a new one
          if (err.statusCode === 401) {
            socket.emit(EVENTS.SERVER_SESSION_EXPIRED);
            socket.disconnect(true);
          }
        }
      });
    };

    // a misspelled event from a client would otherwise be ignored silently
    socket.onAny((eventName) => {
      if (!CLIENT_EVENTS.has(eventName)) {
        logger.warn(`Socket ${socket.id} sent an unknown event: ${eventName}`);
      }
    });

    // the three ways to send: only this socket, everyone, everyone else
    on(EVENTS.CLIENT_DEMO_SEND, (payload, reply) => {
      const data = parsePayload(demoSendSchema, payload, reply);
      if (!data) return;
      const { mode } = data;
      const message = { mode, from: socket.id };
      if (mode === "only-me") {
        socket.emit(EVENTS.SERVER_DEMO_MESSAGE, message);
      } else if (mode === "everyone") {
        io.emit(EVENTS.SERVER_DEMO_MESSAGE, message);
      } else if (mode === "everyone-else") {
        socket.broadcast.emit(EVENTS.SERVER_DEMO_MESSAGE, message);
      }
    });

    on(EVENTS.CLIENT_BOOK_WATCH, (payload, reply) => {
      const data = parsePayload(bookWatchSchema, payload, reply);
      if (!data) return;
      socket.join(bookRoom(data.bookId));
      logger.info(`Socket ${socket.id} is watching ${data.bookId}`);
      reply({ ok: true });
    });

    on(EVENTS.CLIENT_BOOK_UNWATCH, (payload, reply) => {
      const data = parsePayload(bookWatchSchema, payload, reply);
      if (!data) return;
      socket.leave(bookRoom(data.bookId));
      logger.info(`Socket ${socket.id} stopped watching ${data.bookId}`);
      reply({ ok: true });
    });

    // librarian-only: approve or reject a request from the counter feed
    on(EVENTS.CLIENT_BORROW_REQUEST_DECIDE, async (payload, reply) => {
      const data = parsePayload(decideRequestSchema, payload, reply);
      if (!data) return;

      const staff = await authorise(socket, DECIDE_ROLES);
      const request = await services.borrowRequests.update(data.id, {
        status: data.status,
      });
      logger.info(`${staff.id} set ${request.id} to ${request.status} by socket`);
      reply({ ok: true, id: request.id, status: request.status });
    });

    on(EVENTS.CLIENT_HELLO, (payload, reply) => {
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
