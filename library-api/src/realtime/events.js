// Every socket event name, in one place. Use these, never type the string.
// Convention: "<sender>:<subject>:<what>" - see decisions.md.
const EVENTS = Object.freeze({
  CLIENT_HELLO: "client:hello",
  SERVER_HELLO: "server:hello",
  SERVER_PRESENCE_CHANGED: "server:presence:changed",
  SERVER_BOOK_AVAILABILITY_CHANGED: "server:book:availability-changed",
  CLIENT_BOOK_WATCH: "client:book:watch",
  CLIENT_BOOK_UNWATCH: "client:book:unwatch",
  CLIENT_DEMO_SEND: "client:demo:send",
  SERVER_DEMO_MESSAGE: "server:demo:message",
});

export const bookRoom = (bookId) => `book:${bookId}`;

export const CLIENT_EVENTS = new Set(
  Object.values(EVENTS).filter((name) => name.startsWith("client:")),
);

export default EVENTS;
