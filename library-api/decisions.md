# Week 7

# Exercise 2 — The handshake

## Task 4: How socket events are named

Socket.IO never complains about a wrong event name, so:

1. **Format `<sender>:<subject>:<what>`**, lowercase, words joined with
   `-`. The first part shows the direction.
   - from the browser: `client:book:watch`, `client:book:unwatch`
   - from the server: `server:book:availability-changed`,
     `server:queue:promoted`
2. **The client asks, the server reports.** Client events are requests
   (`watch`, `join`), server events say what happened, in the past tense
   (`changed`, `promoted`).
3. **Names are defined once in `src/realtime/events.js`** and only used
   through those constants, never typed as strings.
4. **The server warns about unknown incoming events**, so a misspelled
   client event shows up in the logs.

`client:hello` and `server:hello` are only the test events from Task 2.
