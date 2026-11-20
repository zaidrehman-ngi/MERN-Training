import { EventEmitter } from "node:events";

// services announce what happened here, so they never touch Socket.IO
export const DOMAIN_EVENTS = Object.freeze({
  BOOK_AVAILABILITY_CHANGED: "book.availability-changed",
  BORROW_REQUEST_CREATED: "borrow-request.created",
  BORROW_REQUEST_STATUS_CHANGED: "borrow-request.status-changed",
  REMINDER_SENT: "reminder.sent",
  QUEUE_POSITION_CHANGED: "queue.position-changed",
  QUEUE_PROMOTED: "queue.promoted",
  MEMBER_ACCESS_CHANGED: "member.access-changed",
});

const domainEvents = new EventEmitter();

export default domainEvents;
