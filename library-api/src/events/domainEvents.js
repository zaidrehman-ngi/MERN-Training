import { EventEmitter } from "node:events";

// Things that happened in the app, announced by services. Sockets (and
// later anything else) listen here, so services never touch Socket.IO.
export const DOMAIN_EVENTS = Object.freeze({
  BOOK_AVAILABILITY_CHANGED: "book.availability-changed",
  BORROW_REQUEST_CREATED: "borrow-request.created",
});

const domainEvents = new EventEmitter();

export default domainEvents;
