import type { Server as HttpServer } from "node:http";
import type { EventEmitter } from "node:events";
import { Server } from "socket.io";
import type { DefaultEventsMap, Socket } from "socket.io";
import type { ZodType } from "zod";
import config from "../config/config.ts";
import logger from "../config/logger.ts";
import EVENTS, {
  CLIENT_EVENTS,
  COUNTER_ROOM,
  bookRoom,
  memberRoom,
} from "./events.ts";
import createPresence from "./presence.ts";
import { bookWatchSchema, decideRequestSchema } from "./schemas.ts";
import { DOMAIN_EVENTS } from "../events/domainEvents.ts";
import {
  AuthenticationError,
  DomainError,
  ForbiddenError,
} from "../errors/domainErrors.ts";
import { STAFF_ROLES } from "../types/member.ts";
import type { AuthMember, Role } from "../types/member.ts";
import type { Services } from "../services/createServices.ts";

type SocketData = { member: AuthMember; tokenExp: number };
type LibrarySocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;
type Reply = (response: Record<string, unknown>) => void;

const parsePayload = <T>(
  schema: ZodType<T>,
  payload: unknown,
  reply: Reply,
): T | null => {
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

const ackOf = (ack: unknown): Reply =>
  typeof ack === "function" ? (ack as Reply) : () => {};

const createSocketServer = (
  httpServer: HttpServer,
  domainEvents: EventEmitter,
  services: Services,
) => {
  const io = new Server<
    DefaultEventsMap,
    DefaultEventsMap,
    DefaultEventsMap,
    SocketData
  >(httpServer, {
    cors: { origin: config.corsOrigin, credentials: true },
  });

  // same token check as requireAuth; if it fails the socket never connects
  io.use(async (socket, next) => {
    try {
      const { member, exp } = await services.auth.verifyAccessToken(
        socket.handshake.auth?.token,
      );
      socket.data.member = member;
      socket.data.tokenExp = exp;
      next();
    } catch (err) {
      const known = err instanceof AuthenticationError;
      logger.warn(
        `Socket rejected: ${err instanceof Error ? err.message : err}`,
      );
      const error: Error & { data?: unknown } = new Error(
        known ? err.message : "Server error.",
      );
      error.data = { code: known ? err.code : "INTERNAL_ERROR" };
      next(error);
    }
  });

  // privileged events check the token and the role again, so a demoted librarian can't keep approving
  const authorise = async (socket: LibrarySocket, roles: Role[]) => {
    const { member } = await services.auth.verifyAccessToken(
      socket.handshake.auth?.token,
    );
    if (!roles.includes(member.role)) {
      throw new ForbiddenError(
        "You do not have permission to perform this action.",
      );
    }
    return member;
  };

  let connectedCount = 0;
  const presence = createPresence();

  const counts = () =>
    `${connectedCount} sockets, ${presence.onlineMemberCount()} members online`;

  const broadcastPresence = () => {
    io.emit(EVENTS.SERVER_PRESENCE_CHANGED, {
      members: presence.onlineMemberCount(),
      sockets: connectedCount,
    });
  };

  io.on("connection", (socket) => {
    connectedCount += 1;
    const { member } = socket.data;

    socket.join(memberRoom(member.id));
    if (STAFF_ROLES.includes(member.role)) {
      socket.join(COUNTER_ROOM);
    }

    presence.add(member.id, socket.id);
    logger.info(`Socket connected: ${socket.id} as ${member.id} (${counts()})`);
    broadcastPresence();

    // the socket ends when its token does; the client refreshes and reconnects
    const expiryTimer = setTimeout(
      () => {
        logger.info(`Socket ${socket.id} token expired, disconnecting`);
        socket.emit(EVENTS.SERVER_SESSION_EXPIRED);
        socket.disconnect(true);
      },
      socket.data.tokenExp * 1000 - Date.now(),
    );

    socket.on("disconnect", (reason) => {
      clearTimeout(expiryTimer);
      connectedCount -= 1;
      presence.remove(member.id, socket.id);
      logger.info(
        `Socket disconnected: ${socket.id} as ${member.id}, ${reason} (${counts()})`,
      );
      broadcastPresence();
    });

    // no errorHandler behind socket events, so errors become a failed ack instead of a crash
    const on = (
      eventName: string,
      handler: (payload: unknown, reply: Reply) => unknown,
    ) => {
      socket.on(eventName, async (payload: unknown, ack: unknown) => {
        const reply = ackOf(ack);
        try {
          await handler(payload, reply);
        } catch (err) {
          const known = err instanceof DomainError;
          if (known) {
            logger.warn(
              `Socket ${socket.id} ${eventName} refused: ${err.message}`,
            );
          } else {
            logger.error(
              `Socket ${socket.id} ${eventName} failed: ${err instanceof Error ? err.stack : err}`,
            );
          }
          reply({
            ok: false,
            error: known ? err.code : "INTERNAL_ERROR",
            message: known ? err.message : "Something went wrong.",
          });
          if (err instanceof AuthenticationError) {
            socket.emit(EVENTS.SERVER_SESSION_EXPIRED);
            socket.disconnect(true);
          }
        }
      });
    };

    socket.onAny((eventName: string) => {
      if (!CLIENT_EVENTS.has(eventName)) {
        logger.warn(`Socket ${socket.id} sent an unknown event: ${eventName}`);
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

    on(EVENTS.CLIENT_BORROW_REQUEST_DECIDE, async (payload, reply) => {
      const data = parsePayload(decideRequestSchema, payload, reply);
      if (!data) return;

      const staff = await authorise(socket, STAFF_ROLES);
      const request = await services.borrowRequests.update(
        data.id,
        { status: data.status },
        { id: staff.id, role: staff.role },
      );
      logger.info(
        `${staff.id} set ${request.id} to ${request.status} by socket`,
      );
      reply({ ok: true, id: request.id, status: request.status });
    });
  });

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

  domainEvents.on(
    DOMAIN_EVENTS.QUEUE_POSITION_CHANGED,
    ({ memberId, bookId, position }) => {
      io.to(memberRoom(memberId)).emit(EVENTS.SERVER_QUEUE_POSITION_CHANGED, {
        bookId,
        position,
      });
    },
  );

  domainEvents.on(
    DOMAIN_EVENTS.QUEUE_PROMOTED,
    ({ memberId, bookId, bookTitle, holdUntil }) => {
      io.to([memberRoom(memberId), COUNTER_ROOM]).emit(
        EVENTS.SERVER_QUEUE_PROMOTED,
        { bookId, bookTitle, holdUntil },
      );
    },
  );

  domainEvents.on(DOMAIN_EVENTS.MEMBER_ACCESS_CHANGED, ({ memberId }) => {
    io.to(memberRoom(memberId)).emit(EVENTS.SERVER_SESSION_EXPIRED);
    io.in(memberRoom(memberId)).disconnectSockets(true);
    logger.info(
      `Sockets of ${memberId} disconnected: their role or account changed`,
    );
  });

  return io;
};

export default createSocketServer;
