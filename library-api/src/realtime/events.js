// Every socket event name, in one place. Use these, never type the string.
// Convention: "<sender>:<subject>:<what>" - see decisions.md.
const EVENTS = Object.freeze({
  CLIENT_HELLO: "client:hello",
  SERVER_HELLO: "server:hello",
});

export const CLIENT_EVENTS = new Set(
  Object.values(EVENTS).filter((name) => name.startsWith("client:")),
);

export default EVENTS;
