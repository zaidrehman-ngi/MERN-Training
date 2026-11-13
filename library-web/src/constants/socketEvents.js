// must match library-api/src/realtime/events.ts
export const SOCKET_EVENTS = {
  BOOK_WATCH: "client:book:watch",
  BOOK_UNWATCH: "client:book:unwatch",
  BOOK_AVAILABILITY_CHANGED: "server:book:availability-changed",
  REQUEST_CREATED: "server:borrow-request:created",
  REQUEST_STATUS_CHANGED: "server:borrow-request:status-changed",
  QUEUE_POSITION_CHANGED: "server:queue:position-changed",
  QUEUE_PROMOTED: "server:queue:promoted",
  LOAN_DUE_SOON: "server:loan:due-soon",
};
