// every socket event name, as "<sender>:<subject>:<what>"
const EVENTS = Object.freeze({
  SERVER_PRESENCE_CHANGED: "server:presence:changed",
  SERVER_BOOK_AVAILABILITY_CHANGED: "server:book:availability-changed",
  SERVER_BORROW_REQUEST_CREATED: "server:borrow-request:created",
  SERVER_QUEUE_POSITION_CHANGED: "server:queue:position-changed",
  SERVER_QUEUE_PROMOTED: "server:queue:promoted",
  SERVER_SESSION_EXPIRED: "server:session:expired",
  CLIENT_BOOK_WATCH: "client:book:watch",
  CLIENT_BOOK_UNWATCH: "client:book:unwatch",
  CLIENT_BORROW_REQUEST_DECIDE: "client:borrow-request:decide",
});

export const bookRoom = (bookId: string) => `book:${bookId}`;

export const memberRoom = (memberId: string) => `member:${memberId}`;

// staff only: the server puts librarians and admins in here, clients cannot join
export const COUNTER_ROOM = "counter";

export const CLIENT_EVENTS = new Set<string>(
  Object.values(EVENTS).filter((name) => name.startsWith("client:")),
);

export default EVENTS;
