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

# Exercise 3 — Who is actually connected

## Task 1: Counting connections

In `src/realtime/socketServer.js` the server adds 1 on `connection` and
takes 1 off on `disconnect`, and logs every change with the socket id (and
the disconnect reason).

I opened `socket-test.html` in three tabs and closed them one at a time:

```
Socket connected: J3z54oYlkJzUA5pnAAAA (1 connected)
Socket connected: R_7IZbW-zURx6hAZAAAB (2 connected)
Socket connected: LMlmufZ1h-Z3scdAAAAC (3 connected)
Socket disconnected: J3z54oYlkJzUA5pnAAAA, transport close (2 connected)
Socket disconnected: R_7IZbW-zURx6hAZAAAB, transport close (1 connected)
Socket disconnected: LMlmufZ1h-Z3scdAAAAC, transport close (0 connected)
```

The number was right each time. Closing a tab gives the reason
`transport close`.

## Task 2: When does disconnect fire?

My guess: it fires for everything except navigating to another page. I
tested each case and timed how long the server took to log the disconnect.
The server is on my own laptop, so turning off Wi-Fi doesn't touch the
connection, and sleeping the laptop also sleeps the server. For those two I
made the browser go completely silent (paused the page in the DevTools
Sources tab, so it couldn't answer the server's pings), which is what the server sees in both cases.

| Case | Fired? | After | Reason |
|---|---|---|---|
| Close the tab | Yes | 0.3 s | `transport close` |
| Go to another page | Yes, late | 42.8 s | `ping timeout` |
| Cable / Wi-Fi / sleep (browser goes silent) | Yes, late | 42.8 s | `ping timeout` |
| Chrome's "Offline" switch in DevTools | No (waited 70 s) | – | the socket kept working |

**Surprises:** navigating away didn't close the socket straight away. Chrome
kept the old page alive for a while (probably its back/forward cache), so
the server only found out from the heartbeat. And DevTools' "Offline" only
blocks new requests, it doesn't cut a socket that's already open, so it's
not a real test of losing the network.

**Why it's 43 seconds:** when the other side just disappears, nothing tells
the server. It only finds out from Socket.IO's heartbeat: it pings every
25 seconds (`pingInterval`) and gives up 20 seconds after a ping isn't
answered (`pingTimeout`). So a vanished client stays "connected" for up to
about 45 seconds.

That gap is why the counter said three. A closed laptop lid or a dropped
Wi-Fi still counts for the best part of a minute, and the librarian whose
Wi-Fi drops every 90 seconds reconnects with a new socket while the old one
hasn't timed out yet, so for a while she's counted twice.

## Task 3: Sockets and members

Reloading the page gave a new socket id every time (`jhRW8Tj5...` became
`ek2NbJDy...` for the same tab). So anything stored against a socket id is
lost on every reload or reconnect, and the id says nothing about who it is.

**Both directions:**

- **socket → member:** the page sends the login token in the handshake
  (`io({ auth: ... })`). On `connection` the server checks it with the JWT
  secret and saves the member id on `socket.data.memberId`. No token means a
  guest.
- **member → sockets:** `src/realtime/presence.js` keeps a
  `Map<memberId, Set<socketId>>` in the server's memory, added to on connect
  and removed from on disconnect.

Memory is fine because sockets only exist while this server is running, so
there's nothing to keep after a restart. With more than one server it would
have to move somewhere shared, like Redis.

**Phone and desktop:** the member has **two sockets**, one per device (and
one more per extra tab). That's why it's a **Set** of sockets per member,
not one socket id. With one id, the second device would overwrite the
first, and when either one disconnected the member would look offline even
though the other device is still open. Testing it:

```
Socket connected: ek2NbJDy... as m-2001 (1 sockets, 1 members online)
Socket connected: 45XJbZ7M... as m-2001 (2 sockets, 1 members online)
Socket connected: qE4nIXnB... as m-2002 (3 sockets, 2 members online)
Socket disconnected: ek2NbJDy... as m-2001, transport close (2 sockets, 2 members online)
Socket disconnected: 45XJbZ7M... as m-2001, transport close (1 sockets, 1 members online)
```

Sara stays online until her last device is gone. "Members online" counts
members, not sockets.

## Task 4: Reconnection

With the page open and logged in as Sara, I stopped the server. The page
showed `disconnected: transport close` and then `reconnecting, attempt 1`,
`2`, `3`, `4`. When I started the server again it logged `reconnected` by
itself, with a new socket id (`vJMGaM3t...` became `nxqHeD0E...`).

**The problem:** everything the server held about that socket was in
memory: the connection count, the presence map, `socket.data.memberId`, and
later which books a socket is watching. After a restart all of that is
empty, and the reconnected socket is a brand-new socket to the server. The
client doesn't know any of that. Its screen still shows whatever it had
before.

**What the app has to do on reconnect:** treat it like a fresh connection
on both sides. The client sends its state again (who it is, which books it
was watching), and the server sends its current state back. The client
can't trust what it had while it was disconnected.

**For the online count:**

- The token is sent with every connect (`auth` is a function, so it runs
  again on reconnect), so the server puts the member back in presence.
- The server sends `server:presence:changed` with the member and socket
  counts to everyone on every connect and disconnect, so a reconnected
  client gets the real number straight away.
- The page shows `online: unknown` while it's disconnected instead of the
  old number.

| Moment | Page showed |
|---|---|
| Logged in as Sara | connected, 1 members (1 sockets) |
| Server stopped | disconnected, online: unknown |
| Server started again | connected (new id), 1 members (1 sockets) |

## Task 5: One process, two servers

**Restart:** the count and the presence map are just variables in one Node
process, so a restart wipes them. They come back as clients reconnect and
send their token again (Task 4), but for a few seconds the numbers are
wrong, and any event sent during that gap is lost.

**Two servers behind a load balancer:** each server has its own copy of
the variables. If librarian A is on server 1 and librarian B is on server 2:

- each server only counts its own sockets, so each screen shows a different,
  too-small "online" number
- `io.emit` only reaches sockets on the same server, so when A checks out
  the last copy, B never hears about it, which is the original problem
  again
- Socket.IO starts with long polling, which is several HTTP requests. If
  the load balancer sends them to different servers, the second server
  doesn't know the session id and the connection fails

**Standard solution:** a **Redis adapter** for Socket.IO
(`@socket.io/redis-adapter`). All servers share one Redis, and an emit on
one server is passed through Redis to the sockets on the others. Presence
would move from the in-memory `Map` into Redis too. The load balancer also
needs **sticky sessions**, so a client keeps going to the same server.

**Cost in Week 8:** running Redis (a Docker container or a managed one),
installing the adapter (a few lines in `socketServer.js`), rewriting
`presence.js` to use Redis, cleaning up presence when a server dies, and
turning on sticky sessions in the load balancer. Roughly a day with
testing, plus one more service to run and keep an eye on. It isn't worth it
while there's only one server, but because presence is already in its own
file, only that file and the socket setup would change.