# Week 7

# Exercise 1 — The page that had to be refreshed

## Task 1: Polling the catalogue

I made the catalogue page (`library-web/src/routes/Books.jsx`) fetch the
books every 3 seconds with `setInterval`, left it open for 5 minutes and
watched the catalogue requests in the Network tab.

| In 5 minutes | Result |
|---|---:|
| Requests | 100 |
| Responses with changed data | 1 (the first load) |
| Bytes in total | 108,208 |
| Bytes for nothing | 105,122 |

99 of 100 requests got the same 10 books back, about 1 KB each.

## Task 2: The arithmetic

- 40 librarians × 20 requests a minute = **800 requests per minute**.
- Useful: almost none. In my test only the first load had new data. Even
  if 5 books were checked out a minute, only about 200 of the 800 would
  see a change.
- About 0.85 MB a minute for nothing.

At **1 second** it's 2,400 requests a minute, three times the load. The
screen is at most 1 second old instead of 3, so the 90 second problem gets
smaller but never goes away: there's always a gap before the next request
where a librarian can still promise a copy that's gone. The fix is the
server telling the screens when something changes, and the checkout being
checked on the server so the second one is refused anyway.

## Task 3: Four ways to get new data to the browser

| Way | How it works | Direction | Connection open? |
|---|---|---|---|
| Polling | The browser asks every few seconds | One way | No |
| Long polling | The browser asks, the server only answers when there's news, then the browser asks again | One way | Yes, per request |
| Server-sent events | One HTTP request the server keeps open and writes events into | One way (server → browser) | Yes |
| WebSockets | An upgraded connection where either side can send any time | Two way | Yes |

**For this problem: WebSockets (Socket.IO).** The screen needs the update
straight away, and it also has to tell the server things, like which book
it's watching. Socket.IO also reconnects by itself and has rooms.

**SSE would be enough for** a member's notifications ("due tomorrow", "your
queued book is ready"). The member only listens, and acting on it can be a
normal HTTP request.

## Task 4: The handshake

The browser sends a normal `GET`:

```
GET /socket.io/?EIO=4 HTTP/1.1
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Version: 13
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
```

`Upgrade: websocket` asks for the switch. The server answers
**`101 Switching Protocols`** with a `Sec-WebSocket-Accept` value worked
out from the key, which proves it understood the request.

After that it's still the same TCP connection on the same port, and the
cookies and headers from the first request are still available to the
server. But:

- no more request/response pairs: either side sends whenever it wants
- no status codes per message: errors have to go in the message itself
  (only close codes are left)
- no Content-Type or headers per message: a frame is just text or binary,
  so there's no `Authorization` header on each message either

## Task 5: What really needs real-time

Needs it:

1. **Copy availability at the counter**, so two librarians don't promise
   the same last copy.
2. **Queue promotion**, so the next member knows the book is theirs as soon
   as it comes back.
3. **New borrow requests on the librarian's screen**, because the member is
   waiting for an answer.

Looks like it but doesn't:

1. **Fines** change once a day. Work them out when someone looks (or in the
   nightly job).
2. **Due-date reminders** are a schedule. A cron job that sends or saves
   the reminder is enough, the member doesn't need to be online.
3. **New books and reports**. Showing them on the next page load or with a
   refresh button is fine.

I'd only push the things where a few seconds' delay causes a real mistake.

# Exercise 2 — The handshake

## Task 1: Socket.IO on the same server as Express

I installed `socket.io` **4.8.4** (current stable). `src/server.js` now
creates the HTTP server from the Express app and gives the same server to
Socket.IO (`src/realtime/socketServer.js`):

```js
const httpServer = http.createServer(app);
createSocketServer(httpServer);
httpServer.listen(config.port, ...);
```

On one port, `GET /` still returns the API message and `/socket.io/` does
the Socket.IO handshake and the `101` upgrade.

**The line that made it possible** is `export default app;` at the end of
`app.js`. `app.js` only builds the app and never calls `listen`, so I could
change how the server starts in `server.js` without touching it.

**Without the split**, `app.js` would end with `app.listen(port)`, which
hides the HTTP server inside Express. I'd have had to rework `app.js` to
get hold of the server and put the socket setup in with the routes, and
anything importing `app.js` would start listening on the port.

## Task 2: One event each way

The client is `public/socket-test.html`, served by Express on the same
port, so no CORS. It loads `/socket.io/socket.io.js` (served by Socket.IO
itself) and `socket-test.js`, which is a separate file because Helmet's
CSP blocks inline scripts.

1. The page connects and the server logs `Socket connected: <id>`.
2. The page emits `client:hello` with some text.
3. The server logs it and emits `server:hello` back to that socket.
4. The page shows `received: Hi, the server got "Hello from the browser"`.

## Task 3: Watching the connection

In the Network tab, after a reload:

```
GET  ...transport=polling            -> 200  (session id)
POST ...transport=polling&sid=...    -> 200  (connect + my first hello)
GET  ...transport=polling&sid=...    -> 200
WS   ...transport=websocket&sid=...  -> 101 Switching Protocols (Upgrade: websocket)
frames: 2probe / 3probe / 5 / 42["client:hello",...] / 42["server:hello",...]
```

In the Socket filter the request has status **101** and `Upgrade:
websocket`. In the messages view `2probe`/`3probe` tests the new socket, `5`
switches over to it, and `42` is an event with its name and data.

It started with **long polling**, and my first hello actually went in a
POST before the upgrade finished. Socket.IO does this because plain HTTP
works on every network, while some proxies, firewalls and antivirus block
WebSockets. It connects straight away, upgrades if it can, and stays on
polling if it can't.

## Task 4: An event nobody listens for

My guess was silence. I made the page listen for `server:helo` while the
server sent `server:hello`: no error on the server, nothing in the browser
console, and the page just never showed the reply. So it was silence. The
server doesn't care if anyone listens, and the client ignores events it has
no handler for (same the other way round).

A typo in an event name never shows up as an error, the feature just
doesn't work. So I put every event name in `src/realtime/events.js` and use
those constants instead of strings, and the server now warns about unknown
incoming events (`socket.onAny`). Sending `client:helo` from the page logged
`sent an unknown event: client:helo`. The naming convention is in
`decisions.md`.


## Task 5: Acknowledgements

Socket.IO's acknowledgement is a callback passed as the last argument of
`emit`. The other side gets it as the last argument of its handler and
calls it to answer. `socket.timeout(ms)` makes the callback get an error if
no answer comes in time.

```js
// client
socket.timeout(3000).emit("client:hello", { text }, (err, response) => {
  if (err) log("no answer after 3s");
  else log(`ack: ${JSON.stringify(response)}`);
});

// server
socket.on(EVENTS.CLIENT_HELLO, (message, ack) => {
  ...
  if (typeof ack === "function") ack({ ok: true, receivedAt: ... });
});
```

Sending "approve please" got `ack: {"ok":true,...}` back. A second button
sends `client:nobody-answers`, which the server has no handler for, and
after 3 seconds the page showed `no answer after 3s`.

**Need an ack:** the client actions that change something, like approving
or rejecting a request, joining the queue and watching a book. **Don't:**
the server's notifications (`availability-changed`, `promoted`,
`created`), because they're just information and the database is still the
source of truth.

## Task 6: HTTP route, socket event, or both?

| Action | Where | Why |
|---|---|---|
| Creating a borrow request | **Both** | The member creates it with `POST /borrow-requests`, so it goes through `requireAuth`, validation and gets a proper 201 or error. Then the server emits an event to the librarians. |
| Being told a book became available | **Socket** | Only the server knows when it happens, and the browser can't ask for it without polling. |
| Uploading a cover image | **HTTP** | It's a file upload (multipart) with a size limit and a clear success or error. Nobody else needs to hear about it live. |
| Approving a request | **Both** | The librarian approves with an HTTP call, so it has auth, role checks and a status code, and can be retried. Then the server emits to the member and the other librarians. |
| Loading the catalogue on first paint | **HTTP** | It's a normal `GET`, it works before the socket has even connected, and it can be cached. The socket is only for the changes that come after. |

**What the socket adds in the "both" cases:** the HTTP call only answers
the person who made it. The socket tells everyone else who cares. For a new
borrow request, the librarians see it appear without refreshing. For an
approval, the member sees "approved" straight away and the other librarians
see it's already handled, so two of them don't approve the same request.