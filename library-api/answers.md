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

**Surprise:** navigating away didn't close the socket straight away. Chrome
kept the old page alive for a while (probably its back/forward cache), so
the server only found out from the heartbeat.

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
there's nothing to keep after a restart.

**Phone and desktop:** the member has **two sockets**, one per device (and
one more per extra tab). That's why it's a **Set** of sockets per member,
not one socket id. With one id, the second device would overwrite the
first, and when either one disconnected the member would look offline even
though the other device is still open. With the Set, a member is only
offline once their last socket is gone.

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

# Exercise 4 — Everybody got everybody's message

## Task 1: Three ways to send

I added three buttons to `socket-test.html`. Each sends `client:demo:send`
with a mode, and the server sends `server:demo:message` back out in that
way. With three tabs open, tab 1 pressed each button:

| Tab 1 pressed | Tab 1 | Tab 2 | Tab 3 | Socket.IO call |
|---|---|---|---|---|
| Only me | got it | nothing | nothing | `socket.emit(...)` |
| Everyone | got it | got it | got it | `io.emit(...)` |
| Everyone else | nothing | got it | got it | `socket.broadcast.emit(...)` |

`socket` is the one connection the server is handling, `io` is the whole
server. To send to one specific other socket it's `io.to(socketId).emit()`.

## Task 2: Reproducing the leak

When a borrow request is created (`POST /borrow-requests`), the controller
now does `io.emit("server:borrow-request:created", ...)` with the member id,
name, book and branch. I logged in as Sara in one browser and Usman in
another, and left a third tab not logged in. Sara created a request for
Neuromancer, and **all three** pages got:

```
{"memberId":"m-2001","memberName":"Sara Malik","book":"Neuromancer","branch":"Clifton Branch"}
```

**Privacy problem:** Usman, and even someone who isn't logged in, can see
who borrows what and at which branch. What people read is personal
information. Hiding it on the page doesn't help either, because it has
already reached their browser and anyone can read it in the Network tab.
The server should only send data to people who are allowed to see it.

**Scaling problem:** every event goes to every connected browser, so the
number of messages is events × clients. With 500 people connected and 200
borrows an hour that's 100,000 messages an hour, nearly all of them to
people who don't care, and every browser has to receive and throw them
away. More branches and more members make both numbers grow at once.

## Task 3: Sending less

The availability counter on a book page only needs to know which book and
how many copies are left. So the event is now
`server:book:availability-changed` with just:

```json
{ "bookId": "bk-2", "available": 0 }
```

No member id, no name, no branch.

**The rule:** a broadcast should only carry what every single receiver is
allowed to see and actually needs, because you can't control who reads it
once it's sent.

**The JWT rule from Week 1** is the same: anything in a token can be read by
whoever holds it (it's only encoded, not encrypted), so it should only have
what's needed (id and role) and nothing personal like an email, CNIC or
password hash. Both come down to: once data leaves the server, assume
anyone who has it can read it, so send the minimum.

## Task 4: Does the sender get its own reply?

My guess: yes with `io.emit`, no with `socket.broadcast.emit`. Testing with
three tabs where tab 1 sends:

| Server replies with | Tab 1 (sender) | Tabs 2 and 3 |
|---|---|---|
| `io.emit` | gets its own reply | get it |
| `socket.broadcast.emit` | gets nothing | get it |

So "to everyone" really means everyone, the sender too.

**What getting it wrong would break:**

- **Approving a borrow request.** The librarian's screen already updates
  from the HTTP response. If the broadcast also reaches her and her page
  adds the change again, the request moves twice or shows up twice in a
  list. If the page only updated from the broadcast and I used
  `broadcast.emit`, her own screen wouldn't change at all.
- **The availability counter.** If the event said "one fewer copy" and the
  librarian who did the checkout had already taken one off, her counter
  would go down by two. That's why `server:book:availability-changed`
  sends the actual number (`available: 0`) and not a change: getting it
  twice does no harm.
- **The queue.** A member who joins the queue and also gets the "queue
  changed" broadcast could see their position change twice.

## Task 5: Trust nothing from a socket

The `client:hello` handler now checks its payload with a zod schema
(`src/realtime/schemas.js`: `text` must be a string of 1 to 200 characters)
before doing anything. Bad input gets an ack with
`{ ok: false, error: "VALIDATION_ERROR", details }`, the same shape as my
HTTP errors since there are no status codes, and the handler stops.

**How a client sends made-up data:** it doesn't need my page at all. Anyone
can open the console on the page and call `socket.emit(...)` with
anything, or load the Socket.IO client in their own script and connect to
my server, or send raw `42["client:hello",...]` frames. The event name and
payload are whatever they want.

**How much of my Week 5 and 6 middleware applies: none of it.** Socket.IO
takes the `/socket.io/` requests off the HTTP server before Express sees
them. My request log didn't have a single `/socket.io` line, even for the
handshake. So `helmet`, the rate limiters, `validate`, `requireAuth`,
`requireRole`, the request logger and the error handler never run for
sockets. The only check is the token signature in my `connection` handler
from Exercise 3, and every event handler has to do its own validation and
permission checks.

# Exercise 5 — A room for every book

## Task 1: One room per book

- `client:book:watch` / `client:book:unwatch` with `{ bookId }` (checked
  with zod) put the socket in or out of the room `book:<id>`
  (`socket.join` / `socket.leave`). Disconnecting leaves all rooms by
  itself.
- The test page acts as a book page: `socket-test.html?book=bk-1` watches
  Dune. It sends the watch on every connect, so it rejoins after a
  reconnect.
- When a borrow request is created, the availability event now goes to
  `io.to("book:<id>")` instead of everyone.

Three browsers, two on Dune (bk-1) and one on Hyperion (bk-3):

| Action | Dune tab A | Dune tab B | Hyperion tab C |
|---|---|---|---|
| Dune checked out | got it | got it | nothing |
| Hyperion checked out | nothing | nothing | got it |
| Tab B switches to Hyperion, Dune checked out again | got it | nothing | nothing |

## Task 2: How rooms come and go

I started the server in a script so I could look at Socket.IO's room list
(`io.of("/").adapter.rooms`) while tabs joined and left:

```
nobody connected                     rooms: 0
emit to book:bk-999 (nobody there)   returned true, no error, rooms: 0
one tab watching bk-1                rooms: 2, book:bk-1 has 1
second tab watching bk-1             rooms: 3, book:bk-1 has 2
first tab closed                     rooms: 2, book:bk-1 has 1
last tab closed                      rooms: 0, book:bk-1 doesn't exist
```

- **Emitting to a room nobody has joined:** nothing happens. No error,
  no warning, and it doesn't create the room. The message just goes
  nowhere (silent, like the misspelled event).
- **Creating a room first:** not needed. `socket.join("book:bk-1")` creates
  it if it doesn't exist.
- **When the last client leaves:** the room is deleted straight away.

Every socket is also automatically in a room named after its own id, which
is why one tab watching one book shows 2 rooms.

**At a busy moment:** one room per connected socket, plus one per book that
somebody is looking at. With a few dozen people each on one book page that's
under a hundred rooms. Even in the worst case (all 400 members online and
every one of the 1,400 books being watched) it's under 2,000. Each room is
just an entry in a `Map` with a `Set` of socket ids, and empty ones are
deleted, so it's not a problem.

## Task 3: One place that changes availability

The availability event used to be emitted in the `POST /borrow-requests`
controller, which was wrong twice over: creating a request doesn't change
availability, and a return or the nightly job would never emit it.

Now:

- **`booksService.changeAvailability(bookId, change)`** is the one method
  that changes a book's available count. Approving a borrow request calls
  it with `-1`, returning one at the counter with `+1` (only if it was
  approved), and Friday's nightly job will call the same method. Editing a
  book's `onShelf` count goes through the same service and announces too.
- The books service doesn't know about sockets. It announces
  `book.availability-changed` on an in-app event bus
  (`src/events/domainEvents.js`, a Node `EventEmitter`).
- The socket server listens on that bus and is the only place that sends
  `server:book:availability-changed`, to the book's room. The controller
  has no socket code any more.

So there's one place that changes the number and one place that turns it
into a socket message, whatever caused the change.

## Task 5: The room every socket is already in

A new socket is already in one room, named after its own id
(`socket.rooms` was `["2JIoutETIDvkuAdIAAAA"]` straight after connecting).
So sending to one client isn't a separate feature: `io.to(socketId).emit()`
is just emitting to a room that has one socket in it. Underneath, Socket.IO
only knows one thing, a map of room name to the set of sockets in it.
Sending to one person, to everyone watching Dune, or to the `counter` staff
is all the same operation, just with a bigger or smaller room.

## Task 6: The real-time events for Friday

Rooms used: `book:<bookId>` (anyone on that book's page), `counter` (staff,
joined by the server), and `member:<memberId>` (every device of one member,
joined by the server on connect, so a member only gets their own news).

| Event | Triggered by | Who gets it | Room | Payload |
|---|---|---|---|---|
| `server:book:availability-changed` | a copy goes out or comes back, a librarian edits the count, the nightly job | anyone looking at that book | `book:<bookId>` | `{ bookId, available }` |
| `server:borrow-request:created` | a member creates a borrow request | staff at the counter | `counter` | `{ id, bookTitle, memberName, requestedAt }` |
| `server:borrow-request:status-changed` | a librarian approves or rejects a request | the member who asked, and the counter so others see it's handled | `member:<memberId>` and `counter` | `{ id, status, dueDate }` |
| `server:queue:position-changed` | someone joins or leaves a book's queue, or the first person is promoted | each member still waiting, about their own place | `member:<memberId>` | `{ bookId, position }` |
| `server:queue:promoted` | a copy comes back and the first member in the queue gets it held for them | that member, and the counter so they put it on the hold shelf | `member:<memberId>` and `counter` | `{ bookId, bookTitle, holdUntil }` |
| `server:loan:due-soon` | the nightly job finds loans due tomorrow | that member, if they're online (it's also saved so they see it later) | `member:<memberId>` | `{ loanId, bookTitle, dueDate }` |
| `server:presence:changed` | a librarian's last socket connects or disconnects | staff at the counter ("librarians online") | `counter` | `{ librariansOnline }` |

Queue positions go to each member separately instead of sending the whole
queue to the book's room, so nobody sees who else is waiting. Fines aren't
on the list: they only change once a day, so they're read when the member
opens their account (Exercise 1).

# Exercise 6 — The socket nobody authenticated

## Task 1: Proving the hole

`public/no-token.html` has no login and no token. Its script
(`public/no-token.js`) is four lines:

```js
const socket = io();
socket.emit("client:book:watch", { bookId: "bk-1" });
socket.onAny((event, data) => {
  document.getElementById("log").textContent += `${event} ${JSON.stringify(data)}\n`;
});
```

I opened it, changed Dune's copies from another client, and the page showed:

```
server:presence:changed {"members":0,"sockets":1}
server:book:availability-changed {"bookId":"bk-1","available":2}
```

The server log said `Socket connected: ... as guest` and `Socket ... is
watching bk-1`. So the server accepted the connection and put the socket in a
room without knowing who it was. The page could send any other client event
too.

The `counter` room is the only thing it couldn't get into. The server only
joins a socket to it when the token is valid and has a staff role, and there's
no client event to join it.

None of my middleware stopped this because none of it ever ran. `requireAuth`,
`validate` and the rate limiter are mounted on the Express app, so they only
run for requests Express handles. Socket.IO is attached to the same HTTP
server, but it takes every request to `/socket.io/` before Express sees it.
The WebSocket upgrade is a separate `upgrade` event on the HTTP server that
Express doesn't listen to at all. After that, events are just messages on the
open connection, not HTTP requests, so there's nothing for a middleware to
run on.

## Task 2: Authenticating the connection

The token check used to live inside `requireAuth`. I moved it into the auth
service as `verifyAccessToken(token)`. It verifies the JWT, checks it
against the logout denylist, and loads the member from the database, so the
role comes from the database and not from the token. It throws a 401 if any
of that fails. Now there's one copy and two callers:

- `requireAuth` takes the token from the `Authorization` header, calls it,
  and sets `req.user`.
- The socket server takes the token from `socket.handshake.auth.token` and
  calls it in `io.use()`, which runs once per connection before
  `connection`. If it passes, the member goes on `socket.data.member`. If
  not, `next(error)` refuses the socket and the browser gets a
  `connect_error` with the message.

My old `memberFromHandshake` (a second `jwt.verify` in the socket server)
is gone. It also didn't check the denylist or the database, so a logged-out
token still got in. Because every connected socket now has a member, the
"guest" cases are gone from the connection handler too.

Now `no-token.html` is rejected with `Authentication required.` and gets no
events. A changed or logged-out token is rejected too, and a logged-in page
connects as before.

## Task 3: Per-event authorisation and the expiring token

The privileged event is `client:borrow-request:decide` (`{ id, status }`,
approve or reject from the counter feed). It calls the same
`borrowRequests.update` as `PATCH /borrow-requests/:id`, so approving still
takes a copy off the shelf and announces availability. Before doing anything
the handler checks the payload with zod, then calls `authorise(socket,
["librarian", "admin"])`. That runs `verifyAccessToken` again on the
handshake token and checks the role it gets back from the database.

- A member (Sara) got `FORBIDDEN`.
- The admin got `{ ok: true, status: "rejected" }`.
- After the admin's token was logged out, the same event got
  `UNAUTHORIZED: This token has been logged out.` and the socket was
  disconnected.

For expiry I chose to disconnect at the token's `exp` and let the page
refresh and reconnect. I ran the API with `JWT_EXPIRES_IN=10s`: after 10
seconds the page logged `session expired`, got a new token and reconnected,
and the next approve worked. The reasoning is in `decisions.md`.

## Task 4: CORS for sockets

Socket.IO doesn't use the Express `cors()` middleware. It has its own `cors`
option on `new Server(...)`. Both read the same `CORS_ORIGIN` from `.env`, so
they can't drift apart.

**Working:** in `library-web` I added `src/api/socket.js` (connects to the
API's origin with the token from `sessionStorage`), saved the token on login,
and show the connection state in the header. With the origin set to
`http://localhost:5173` the header showed `Live: connected`, the server
logged `Socket connected ... as m-2001`, and the polling responses had
`Access-Control-Allow-Origin: http://localhost:5173`.

**Wrong origin:** I set only the socket server's origin to
`http://localhost:5999`. Login still worked (Express CORS was right) but the
header said `Live: error: xhr poll error`. The console had:

```
Access to XMLHttpRequest at 'http://localhost:3200/socket.io/?EIO=4&transport=polling&t=...'
from origin 'http://localhost:5173' has been blocked by CORS policy:
The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5999'
```

**How it differs from the Week 5 HTTP CORS error:**

- In Week 5 the blocked request was one of mine, like
  `GET /api/v1/books`. The error came out of my own axios call, at the line
  that made it, and happened once per click.
- Here the error my code gets is `connect_error: xhr poll error`, with no
  mention of CORS. The CORS message is only in the console, and the request
  it names is an `XMLHttpRequest` to `/socket.io/?EIO=4&transport=polling`
  that I never wrote. Socket.IO makes it internally.
- In the Network tab the requests show `200`. The server answered fine; the
  browser threw the response away.
- The server logged nothing. The request never reached `io.use`, so there's
  no "Socket rejected" line like a bad token gives.
- Socket.IO keeps retrying in the background, so the console fills with the
  same error every few seconds. That looks like the server is down or the
  network is flaky.

So it reads like a connection problem, not a configuration problem, and the
only place that says "CORS" is a console line about a request I don't
recognise.

One more thing I found: with the origin still wrong, a client that skips
polling (`transports: ["websocket"]`) connected fine. Browsers don't apply
CORS to WebSockets, so Socket.IO's `cors` option only protects the polling
requests. It isn't a security check. The token check in `io.use` is what
actually stops strangers.

## Task 5: HTTP guards vs socket guards

Everything an HTTP request goes through (`app.js` and the routers), and what
the socket path has instead:

| HTTP guard | Socket equivalent | What I did |
|---|---|---|
| `requireAuth` (token, denylist, member still exists) | `io.use()` calls the same `verifyAccessToken` | Task 2 |
| Token expiry (every request is checked) | timer disconnects the socket at the token's `exp` | Task 3 |
| `requireRole` | `authorise(socket, roles)` on `client:borrow-request:decide`; `counter` room only joined by staff at connect | Task 3, Ex 5 |
| `validate` (zod) | `parsePayload` with a zod schema in every client event | `client:demo:send` had none, added today |
| `errorHandler` | **nothing**, until today | see below |
| `cors()` | Socket.IO's own `cors` option, same `CORS_ORIGIN` | only covers polling; a WebSocket-only client ignores it (Task 4) |
| `apiRateLimiter`, `loginRateLimiter`, `bookSearchRateLimiter` | **nothing** | finding |
| `express.json()` body limit (100 kb) | Socket.IO's `maxHttpBufferSize`, default 1 MB | left at the default, finding |
| `requestId` + `requestLog` / morgan (every request logged with id, status, time) | connect, disconnect, rejections and some events are logged with the socket id; no per-event log | finding |
| 404 for unknown routes | `onAny` warns about unknown events, the client just gets an ack timeout | good enough |
| `helmet()` | not needed: its headers protect pages the browser renders, socket messages aren't pages | none |
| `cookieParser` | not needed: the socket token comes in `handshake.auth` | none |

**The `errorHandler` gap was a real bug.** Express catches anything a route
throws and turns it into a response. Nothing does that for socket handlers.
`client:demo:send` destructured its payload without checking it, so one line
in the console from any logged-in user, `socket.emit("client:demo:send")`,
threw a `TypeError`, hit `uncaughtException`, and stopped the whole API. I
fixed it now instead of leaving it for Friday:

- every handler is registered through one `on()` wrapper in
  `socketServer.js`, which catches errors and answers with a failed ack
  (`Something went wrong.` for unexpected ones, logged with the stack)
- the 401 handling (disconnect so the client reconnects with a new token)
  moved into the same wrapper, so it works for any event
- `client:demo:send` now has a zod schema

After the fix the same emit gets a `VALIDATION_ERROR` ack and the API keeps
running.

**Findings for the Friday review:**

1. **No rate limiting on socket events.** A logged-in client can send
   `client:borrow-request:decide` or `client:hello` as fast as it likes. The
   HTTP limiters never see it because it's one long connection, not
   requests.
2. **No origin check for WebSocket connections.** The `cors` option only
   covers polling. The token stops strangers, but a page on another site
   could still connect with a stolen token. `allowRequest` could check
   `Origin`.
3. **Payloads can be 10× bigger than HTTP bodies** (1 MB vs 100 kb).
4. **No per-event access log.** There's nothing like morgan's line for
   every request, so the log can't answer "who sent what, when, and did it
   work" for socket events.
5. **Listening after logout or a role change** keeps working until the
   token expires, at most 15 minutes (accepted in `decisions.md`, Task 3).


# Exercise 7 — The four hundred line controller

## Task 1: What the longest handler does

My controllers were already thin after Week 6, so no handler is anywhere
near 400 lines. The longest is `login` in `auth.controller.js`. Following
everything that happens for `POST /auth/login`, including what it calls:

| # | What it does | Pile |
|---|---|---|
| 1 | Limits failed attempts to 5 per email + IP (`loginRateLimiter`), answers 429 | rules (the limit), HTTP (the 429) |
| 2 | Checks the body has an email and password (`validate(loginSchema)`), answers 400 | HTTP |
| 3 | Finds the active member by email, with the password hash | database |
| 4 | Checks the password with bcrypt, or against a dummy hash if the email doesn't exist, so the timing doesn't show which emails are registered | rules |
| 5 | Refuses with "Email or password is incorrect." (same message for both cases) | rules |
| 6 | Signs the access token: what goes in it (`sub`, `role`, a `jti`) and how long it lasts | rules |
| 7 | Puts the access token in an httpOnly cookie | HTTP |
| 8 | Makes a random refresh token, works out its expiry (7 days) and hashes it | rules |
| 9 | Saves the refresh token hash | database |
| 10 | Puts the refresh token in an httpOnly cookie limited to `/api/v1/auth` | HTTP |
| 11 | Sends 200 with the access token and only `id`, `name`, `email`, `role` | HTTP |

Most of the piles are already in the right layer: the HTTP ones are in the
route, middleware and controller, the rules are in `auth.service.js`, and
the two database ones are in the users and refresh tokens repositories.

The exception is **#6**. Signing the access token is a rule (what a token
contains and how long it lives) but `createAccessToken` is in the
controller. Nothing outside HTTP can make a token without copying it.
`refreshToken` in the same controller already calls it a second time.
**#1** is also split: the limit itself is a rule, but it's in middleware,
because it has to run before the body reaches the handler.

## Task 2: The rules for each layer

**Controller** (with its routes and middleware), the HTTP layer:
- knows about `req`, `res`, status codes, headers, cookies, query strings
  and the response body shape
- reads what the request asked for, calls **one** service method, and turns
  the result (or the error) into a response
- doesn't know library rules, and never touches Prisma or a repository

**Service**, the library's rules:
- knows the rules: who may borrow, how many, when it's due, when a token
  is valid, what happens when a copy comes back, which events to announce
- gets plain values in (ids, objects) and gives plain values back, or
  throws an error that says *what* went wrong ("book not found", "no copies
  left")
- calls repositories and other services, never Prisma directly
- doesn't know whether it was called by a route, a socket event or the
  nightly job, so it never sees `req`, `res`, a socket or a status code

**Repository**, the database:
- knows Prisma, table and column names, and how to turn a row into the
  API's shape
- one method is one question or one change to the database
  (`findByIsbn`, `changeAvailableCopies`); it doesn't decide if that change
  is allowed
- knows nothing about HTTP and nothing about the rules

**The test:**

| | `req`, `res`, a status code | Prisma |
|---|---|---|
| Controller | **yes**, only here | no |
| Service | no | no |
| Repository | no | **yes**, only here |

If a service file needs a status code to compile, or a controller imports
Prisma, it's in the wrong layer.

Checking the code against that test before moving anything:

- **Prisma:** passes. No controller or service imports Prisma; only
  repositories use it.
- **`req` / `res`:** passes. They only appear in controllers and middleware.
- **Status codes:** fails in two places.
  - `users.repository.js` and `borrowRequests.repository.js` throw
    `new ApiError(..., 422)` when a branch, member or book doesn't exist.
    A repository is choosing the HTTP status.
  - Services call `notFound()`, `conflict()` and `unauthorized()`. The
    number isn't written in the service, but those helpers build an
    `ApiError` with 404, 409 or 401 in it, so the service still decides the
    status. The nightly job would get an error carrying a 404 it has no use
    for.
- **Rules in the wrong place:**
  - `createAccessToken` (what goes in a token, how long it lasts) is in the
    controller.
  - `books.repository.js` checks `available === "true"`, which is the query
    string format leaking into the repository.

## Task 3: Errors without status codes

My guess is in `guesses.md`.

The Week 5 `ApiError` had the problem from Task 2 built in: every
`notFound()` or `conflict()` in a service created an error with 404 or 409
inside it. So I added `src/errors/domainErrors.js` for the services:

- `DomainError` has a message, a `code` and `details`, and **no status**
- `NotFoundError`, `ConflictError` and `AuthenticationError` extend it and
  say what kind of failure it was
- `BorrowLimitReachedError` extends `ConflictError`, with the code
  `BORROW_LIMIT_REACHED` plus the member id and the limit

The rule is in `borrowRequests.service.js`. Before creating a request it
counts the member's open requests (pending or approved) with a new
repository method `countOpenForMember`, and throws `BorrowLimitReachedError`
at 5. All the services now throw these classes instead of the `ApiError`
helpers, so none of them can produce a status code any more.

The status is picked in one place, `statusForDomainError` in
`errorHandler.js`: not found → 404, conflict → 409, authentication → 401.
The response body is the same `{ error, message, details }` as before, so
nothing changed for the frontend or Postman. `ApiError` stays for the HTTP
layer only (middleware like `requireRole`). The socket server also stopped
checking `statusCode === 401` and checks `instanceof AuthenticationError`
instead.

**Over HTTP:** Sara's 6th open request got
`409 {"error":"BORROW_LIMIT_REACHED","message":"Members can have at most 5 open borrow requests.", ...}`.

**From a cron job:** I built the services in a plain Node script with no
Express (what the nightly job will do) and called
`borrowRequests.create` six times. The 6th threw a
`BorrowLimitReachedError` with `code: "BORROW_LIMIT_REACHED"`, the message,
`memberId` and `limit`, and `statusCode: undefined`. The job can catch it
by class or code, log it and move on to the next member. It never has to
know about 409.

## Task 4: MVC vs layered

**MVC:**

```
request ──► Controller ──► Model ──► database
                │
                ▼
              View ──► response
```

**Layered (what this API is):**

```
request ──► Route + middleware ──► Controller ──► Service ──► Repository ──► database
                                       │             ▲
response ◄─────────────────────────────┘             │
                                     socket handler ─┤
                                     nightly job ────┘
```

**M, V and C in an API with no views:**

- **M (Model):** the data and the code around it. In Express MVC that's
  usually a Mongoose or Prisma model, with the rules often added to it.
- **V (View):** no HTML pages, so the view is just the JSON response. In
  practice it's the `res.json({...})` shape in the controller.
- **C (Controller):** takes the request, calls the model, and picks the
  response. In small apps it ends up doing the rules too, which is the 400
  line controller.

**What the layered version adds:**

MVC only says "keep the data away from the HTTP part". It doesn't say where
the library's rules go, so they end up in the controller or the model. The
layered version splits the M into two, and gives each layer one job (the
rules from Task 2):

- a **service** layer for the rules (borrow limit, due dates, who may
  approve), with no `req`, `res` or status codes
- a **repository** layer that is the only place that talks to Prisma

Calls only go one way: controller → service → repository. Because the
rules don't depend on HTTP, the service can be called from more than one
door. The socket handler and Friday's nightly job call the same
`borrowRequests.create` the route does, and get the same
`BorrowLimitReachedError`.

## Task 5: The three worst files

I checked each one by calling the services from a plain Node script, the
way the nightly job will.

**1. `src/services/borrowRequests.service.js` (with
`schemas/borrowRequests.schema.js`): the rules are decided by the HTTP
body.**
`create` saves whatever it gets. The status, the due date and the fine all
come from the request body, and the zod schema is the only thing checking
them. So the rules "a new request starts as pending", "due in N days" and
"fine comes from the book" are written nowhere.
What breaks:
- A member can `POST` `status: "approved"` and skip the librarian. I
  created one with `dueDate: "2020-01-01"` and `finePerDay: 0`. It saved
  as approved, but no copy was taken off the shelf (bk-3 stayed at 2),
  because only `update` does that.
- The nightly job or a socket handler creating a request has to invent a
  due date and a fine itself, exactly like a client would.

**2. `src/repositories/books.repository.js`: the repository knows the
query string format.**
`findAll` checks `available === "true"`, the string from `?available=true`,
and sets the paging defaults. That's the HTTP layer's job.
What breaks: a caller that isn't HTTP passes a real boolean. `available:
true` isn't `"true"`, so the filter flips and returns the books with **0**
copies. A nightly job asking for "books on the shelf" gets the opposite
list, with no error.

**3. `src/repositories/borrowRequests.repository.js`: the repository
answers in HTTP.**
When the member or book id doesn't exist, it throws
`new ApiError("A related record does not exist.", 422, { code:
"VALIDATION_ERROR", details: [{ field: "userId" }] })`. It picks a status
code and phrases it as a form field error. (`users.repository.js` does the
same for a missing branch.)
What breaks: the nightly job creating a request for a member who was
deleted gets an `ApiError` with `statusCode: 422` and "field `userId`" for
a field it never sent. It isn't a `DomainError`, so the job can't tell
"member doesn't exist" apart from a real validation failure, and the
service can't catch it as a `NotFoundError` either. The lookup of member
and book (a rule: "both must exist and be active") is also hidden inside
`toRow`, a row-mapping helper.

# Exercise 8 — Controllers, services, repositories

## Task 1: Books

The three files were already there from Exercise 7, so I checked them
against the rules instead of starting over:

- **Controller** (`books.controller.js`): only reads `req` and sends
  `res`. Nothing to change.
- **Service** (`books.service.js`): ISBN must be unique, copies can't go
  below zero, announce availability changes. Fine, but the paging default
  (10 per page) was hiding in the repository. I moved it into the service
  so a caller that isn't HTTP gets the same default.
- **Repository** (`books.repository.js`): the one that still leaked.
  Prisma errors (duplicate ISBN, the `available_copies >= 0` CHECK)
  escaped it, and `errorHandler` had to read Prisma error codes to turn
  them into a 409 or 422. So the ORM was being touched outside the
  repository. Now the repository catches them and throws our own
  `IsbnTakenError` and `InvalidValueError`. The ISBN entry is gone from
  `prismaErrors.js`, which only handles users and borrow requests now.

Same responses as before: a duplicate ISBN is still 409 with the same
message and details, and the CHECK is still 422 `VALIDATION_ERROR`.

Postman after (API started with `JWT_EXPIRES_IN=10s` for the expiry
step): 41 requests, 69 assertions, 0 failures. All green, nothing changed.

## Task 2: Borrow requests

`borrowRequests.service.create(memberId, bookId)` now takes just the two
ids. Everything else is a rule, so the service decides it:

- the member and the book must exist (`NotFoundError` if not). This check
  used to be hidden in the repository's `toRow`; now the service asks the
  users and books services.
- a member can have at most 5 open requests (`BorrowLimitReachedError`)
- a new request is always `pending`, due in 14 days, with the fine copied
  from the book

It returns the new request or throws one of our domain errors. There's no
`req`, `res`, status code, `ApiError` or Prisma anywhere in the file. The
controller just passes `req.user.sub` and `req.body.bookId` in.

**Evidence:** `db/create-borrow-request.js`. It builds the repositories
and services straight from Prisma, with no Express and no server running,
and calls the service:

```
request 1: created br-1118 (pending, due 2026-11-11, fine 25/day)
...
request 5: created br-1122 (pending, due 2026-11-11, fine 25/day)
request 6: limit reached -> BorrowLimitReachedError BORROW_LIMIT_REACHED: Members can have at most 5 open borrow requests.
missing book: not found -> NotFoundError NOT_FOUND: Book not found.
missing member: not found -> NotFoundError NOT_FOUND: User not found.
cleaned up: rejected 5 requests
```

The script tells the errors apart with `instanceof`, not a status code,
which is how the nightly job will do it.

## Task 3: What the repository is for

The three answers: swap the database later, a seam for tests, or
translate between the database's shape and the app's.

**Mine is the third.** Prisma already hides SQL. The repository hides
our database's layout: column names (`available_copies` -> `onShelf`),
`bk-1` ids vs the UUIDs tables join on, `is_active` soft delete, and
Prisma errors turned into our own errors.

**Switching database** (e.g. MySQL): only the database layer changes. The
Prisma provider and migrations, the `adapter-pg` adapter, the Postgres
error codes we read, and the partial unique index on ISBN (MySQL has no
partial indexes). Services, controllers and routes stay the same.

**Which methods earn it:**
- Earn it: `books.findAll` (filters, sort, paging), books writes (error
  translation, atomic `increment`), the `deleteById`s (soft delete), the
  borrow request writes (`bk-1` -> UUID lookups),
  `users.findCredentialsByEmail` (only place the password hash is read),
  `refreshTokens.findValidByHash` and `revoke` (valid / use once).
- Just forwarding: the `revokedTokens` methods and the simple user
  finds. `findByEmail` and `findByEmailExcludingId` are nearly the same
  query.

## Task 4: Who owns the transaction

**The service owns it.** Approving is one action for the library ("lend
a copy"), but two writes: take a copy off the shelf, then save the
request as approved. Only the service knows those two belong together.

How: `createRepositories` has a `transaction(work)` that gives repositories
sharing one Prisma transaction. `borrowRequests.service` `update` and
`returnBook` run inside it. The service never sees Prisma, just
`transaction(...)`. Events wait until it commits, so a rolled back change
is never announced to sockets.

Proof (`db/approve-rollback.js`, second write fails with `finePerDay: -1`):

```
Before: bk-3 on shelf = 2, request is pending, availability events = 0
Second write failed: InvalidValueError VALIDATION_ERROR: One of the values is not allowed.
After: bk-3 on shelf = 2, request is pending, availability events = 0
Normal approve: bk-3 on shelf = 1, request is approved, availability events = 1
```

The copy taken in the first write was put back.

**Why not the others:**
- Controller: it would have to know the two writes exist, which is a rule,
  and the nightly job or a socket calling the service would get no
  transaction at all.
- Repository: each one only knows its own table. A transaction across
  books and book_requests would mean one repository writing to the
  other's table, or deciding what "approve" means.

## Task 5: Moving the socket emit

**What I did:** the service doesn't emit to the socket, it announces what
happened. `books.service` calls
`events.emit("book.availability-changed", { bookId, available })` on a
plain Node `EventEmitter` (`src/events/domainEvents.js`). The socket server
is the one that listens and turns it into a socket message to the book's
room. The service only imports the event names, never Socket.IO.

So the Task 2 script still runs with no server: the event fires and
nobody is listening. With the server up, approving and returning bk-3 sent
`available: 1` and then `available: 2` to a socket watching it.

**What I rejected:**
- Importing `io` into the service: the coupling the task is about. The
  script would need a socket server just to create a request.
- Passing `io` (or a "notifier") into the service: no import, but the
  service still talks in sockets and rooms.
- Emitting from the controller after the service returns: a socket
  handler or the nightly job changing availability would never announce
  it.
- Redis pub/sub or an outbox table: needed once there's more than one
  server, too much for one process today.

## Task 6: Members, and the three side by side

Members already had the three files. The leak was the same as books in
Task 1: a duplicate email came back from Prisma and `errorHandler` had to
translate it. Now all three repositories use one helper
(`repositories/dbErrors.js`) and `prismaErrors.js` is gone.

| | Books | Members | Borrow requests |
|---|---|---|---|
| list | `list(query)`, paged | had no query | filters, no paging |
| create | `create(data)` | `create(data)` | `create(memberId, bookId)` |
| create response | 201, `{ data }`, Location | 201, a message | 201, `{ data }`, no Location |
| delete | soft delete | soft delete | none |
| other actions | change availability | none | approve, return |
| duplicate check | `findByIsbn` + id | `findByEmailExcludingId` | none |
| DB errors | repository | `errorHandler` | `errorHandler` |

**Real differences (kept):**
- Members create answers with a message, not the user, so nobody can find
  out which emails are registered.
- Borrow requests are created from two ids, because the rules set the
  rest (Task 2).
- Borrow requests can't be deleted, they're history. They get rejected
  or returned instead.
- Approve and return are actions on a request, books have no such thing.

**Leftovers (fixed):**
- DB errors outside the repository for members and borrow requests.
- `findByEmailExcludingId`: now `findByEmail` + an id check, like books.
- Members and borrow requests lists took no paging. Now `list(query)` for
  all three, with optional `page`/`limit` (no page = whole list, same as
  before).
- Borrow request create had no `Location` header.
- `POST /borrow-requests/:id/approve` said "approved" but did nothing,
  and only allowed librarians while `PATCH` allows admins too. It now
  really approves, for both.
- Member update accepted any string as an email. Create checked it.
- A sign-up race on the same email gave a 409, which tells you the email
  exists. It now gets the same message as any other sign-up.

# Exercise 9 — Who creates the dependencies

## Task 1: Find the coupling

My borrow service doesn't import the repository. It already gets it as a
parameter (`borrowRequests.service.js` line 15,
`borrowRequestsRepository`), plus the books and users services and
`transaction`. Its only imports are the error classes and the event
names.

So the line that makes it need a live database isn't in the service, it's
where the service gets built:

- `src/app.js` line 34: `const repositories = createRepositories(prisma);`
  Every service is built on top of this, so `countForMember` on line 38
  of the service always ends up as a real Prisma query.
- Because of that, `repositories.transaction(...)` in `createServices.js`
  line 12 is `prisma.$transaction`, and `update` and `returnBook` (lines
  64 and 84) go through it.

**For that line not to be a problem:** whoever builds the service has to
be able to pass something else in. Any object with the same methods
(`findAll`, `findById`, `create`, `updateById`, `countForMember`) that
behaves the same way, e.g. returns `null` when nothing is found, and a
`transaction(work)` that just runs `work`. That's already true:
`createServices(repositories, events)` takes them as a parameter too, so
only `app.js` and the `db/` scripts pick Prisma.

## Task 2: Invert it

The services were already factory functions that receive their
repositories (`createBorrowRequestsService(borrowRequestsRepository, ...)`),
so that part was done. What was still wrong is where the real ones got
plugged in: `app.js` imported Prisma at the top, so just importing the app
meant a real database.

Change (about 15 lines, ignoring the indent):
- `app.js` is now `createApp(services)`. It doesn't import Prisma, the
  repositories or the services any more, it just uses what it's given.
- `server.js`, where the app starts, does the wiring:

```js
const services = createServices(createRepositories(prisma), domainEvents);
const app = createApp(services);
```

and gives the same `services` to the socket server. That's now the only
place in `src/` that picks the real database.

## Task 3: A fake repository

`test/fakeRepositories.js` has fake books, users and borrow request
repositories: the same methods as the real ones, but the data is plain
arrays. `test/borrowRules.test.js` hands them to the real
`createBorrowRequestsService` (and the real books and users services), so
the rules being tested are the real ones. Run with `npm test`. I ran it
with `DATABASE_URL` pointing at nothing and it still passed, because
nothing touches the database.

The awkward rule: member `m-1` with five `approved` requests tries a
sixth, and gets `BorrowLimitReachedError` with nothing saved. I also
checked that four out still lets you borrow, and that returned books
don't count.

**How long it took:**

| | Fake | Real database |
|---|---|---|
| set up 5 books out | one line (5 objects in an array) | create 5 requests and approve each one |
| run | 2 ms (whole `npm test` 0.3 s) | 0.6 s, plus 2.5 s to reseed after |
| needs | nothing | Postgres running, seeded data |
| clean up | none, the array is thrown away | return all 5, or reseed |

In the database it was also fiddly: no single book had 5 copies on the
shelf (bk-1 only has 3), so I had to spread the five over bk-7 and bk-1,
and every approve changed the real copy counts. Writing the fakes the
first time took longer than one database script, but each new case after
that is a line or two.

## Task 4: What dependency injection actually is

**A piece of code doesn't go and get the things it needs, whoever uses it
hands them over.**

What I actually saw this afternoon:

1. **The rules ran without the app.** The borrow service ran from a plain
   script with no Express, and then with no database at all (a dead
   `DATABASE_URL` and the tests still passed).
2. **The awkward case was one line.** "Five books out" was five objects in
   an array, 2 ms, instead of creating and approving five real requests
   and reseeding afterwards.
3. **The same service ran inside a transaction without changing it.** For
   Exercise 8 Task 4, `createServices` just builds the services again with
   the transaction's repositories and an emitter that holds the events
   back. The service code didn't know or care.

## Task 5: What I expect a framework to add

Having done it by hand, I expect NestJS to:

**Add:**
- the wiring done for me. No hand-written `createServices` listing who
  gets what, it works it out from what each class asks for.
- one standard way to do it, so every module looks the same
- an easy way to swap one thing for a fake in tests, like my Task 3 but
  without building the whole tree by hand

**Cost:**
- magic: when something is missing I'd get an error about a "provider"
  instead of seeing the line where it's passed in
- decorators and TypeScript just to say what a class needs
- harder to do something unusual, like my transaction trick of building
  the services again with different repositories
- more to learn before the first endpoint works

# Exercise 10 — The bug the compiler would have caught

## Task 1: Adding TypeScript

I installed `typescript` and `@types/node` as dev dependencies, then ran
`npx tsc --init` to get a tsconfig.json. I got **TypeScript 7.0.2**.

I turned `strict` on straight away. I also changed a few things in the
generated file:

- `noEmit` and `allowImportingTsExtensions`, because Node 24 can run `.ts`
  files itself, so I only need tsc to check the code, not build it. The
  Prisma client is already a `.ts` file and `prisma.js` imports it with
  the `.ts` at the end, so this was needed anyway.
- `erasableSyntaxOnly`, so I don't use anything Node can't strip, like
  enums.
- `allowJs` on and `checkJs` off, so my JS files are still part of the
  project but don't get checked until I convert them.
- `types: ["node"]` and `include` for `src`, `test` and `db`. I took out
  the `jsx` option and the source map / declaration settings since this
  is a backend.

I added `npm run typecheck` (it just runs `tsc`). It compiles with 0
errors.

To make sure strict was really on, I made a quick `.ts` file with
`(name) => name.toUpperCase()` and got this, then deleted the file:

```
error TS7006: Parameter 'name' implicitly has an 'any' type.
```

## Task 2: Typing the data

I wrote the `Book` type in `src/types/book.ts`, using the fields the API
sends back. I made `author` `string | null` because in the schema it's
`author String?` and bk-4 (the 1961 report) has no author. `year`,
`isbn`, `coverUrl` and `finePerDay` can be null too, so I did the same
for them.

Then I wrote `surname(book)` in `src/utils/surname.ts` the way it was in
Week 2:

```ts
export const surname = (book: Book): string => {
  const parts = book.author.split(" ");
  return parts[parts.length - 1];
};
```

and ran `npm run typecheck`:

```
src/utils/surname.ts(4,17): error TS18047: 'book.author' is possibly 'null'.
src/utils/surname.ts(5,3): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.
```

The first error is exactly the Week 2 bug. The second one is because
the last item of the array might not exist, and I said the function
always returns a string.

To fix it I made `surname` return `string | null`. If there's no author
(or it's empty) it returns `null`, otherwise the last word of the name.
I tried it: "Frank Herbert" gives "Herbert" and bk-4 gives `null`.

What the compiler made me decide is what should happen when a book has
no author. In JavaScript I just assumed every book has one, and I only
found out it didn't when the page went blank, and then I fixed that one
place. Now the return type says there might be no surname, so anywhere
that uses `surname` has to handle that (like showing "Unknown author")
or it won't compile.

## Task 3: The basics

**Object type:** a book, from `src/types/book.ts`:

```ts
type Book = {
  id: string;
  title: string;
  author: string | null;
  onShelf: number;
  // ...
};
```

**Union:** member roles. The task says four, but our database only allows
three (`members_role_check`), so:

```ts
type Role = "user" | "librarian" | "admin";
```

Anything else, like `"Admin"` or `"guest"`, is a compile error.

**Array:** what `GET /books` sends back in `data`:

```ts
const books: Book[] = await booksService.list(query);
```

**Optional field:** the books query. Every filter can be left out, which
is what `.optional()` means in `booksQuerySchema`:

```ts
type BookQuery = {
  author?: string;
  title?: string;
  available?: boolean;
  page?: number;
  limit?: number;
};
```

**Function signature with a typed return:** creating a borrow request
(Exercise 8 Task 2). Two ids in, a promise of the new request out:

```ts
create(memberId: string, bookId: string): Promise<BorrowRequest>
```

And `surname` from Task 2: `(book: Book): string | null`.

**type vs interface**

Both can describe an object, and for that they mostly work the same. The
real differences:

- An `interface` can be declared again with the same name and the two get
  merged. A `type` can't be reopened, declaring it twice is an error.
- A `type` can be a union (`"user" | "librarian" | "admin"`) or a mix of
  other types. An `interface` can only describe an object shape.

What I'm using:

- `type` for my own data: `Book`, `Role`, `BookQuery`. `Role` has to be a
  type because it's a union, and I'd rather use one keyword for all of
  them.
- `interface` only where I need the merging, which is adding things to
  other libraries' types. For example, when I convert `requireAuth`,
  Express's `Request` doesn't know about `req.user`, so I'd add it by
  reopening Express's `Request` interface.

## Task 4: any, unknown and as Book

Guesses are in guesses.md. What happened with bk-4's JSON
(`"author": null`, no `onShelf`):

| | Compiler | Runtime |
|---|---|---|
| `any` | no errors at all, `asAny.author.split(" ")` compiles | `TypeError: Cannot read properties of null (reading 'split')` |
| `unknown` | `error TS18046: 'asUnknown' is of type 'unknown'.` even for `.title` | doesn't get that far |
| `as Book` | `error TS18047: 'asBook.author' is possibly 'null'.`, but `asBook.onShelf.toFixed(0)` compiles | `TypeError: Cannot read properties of undefined (reading 'toFixed')` |

`as Book` also compiled `JSON.parse('{"name":"Aisha Khan"}') as Book`,
which isn't a book at all, and crashed on `.title.toUpperCase()`.

**Which one checks anything at runtime? None of them.** Types are removed
before the code runs. `any` turns checking off, `as Book` is me telling
the compiler "trust me", and `unknown` only forces me to check, it
doesn't check for me.

That's why zod is still needed. Data from outside (request bodies, query
strings, JSON files) can be anything, and only real code running at
runtime can look at it. A zod schema does that check, and with
`z.infer<typeof schema>` it gives the TypeScript type too, so the check
and the type can't drift apart. So the safe way is: take it as `unknown`,
run it through zod, and only then use it as a `Book`. Our `validate`
middleware already does this for every body and query.

## Task 5: Converting the borrow requests service

Converted `src/services/borrowRequests.service.js` to `.ts`. The types for
the data are in `src/types/borrowRequest.ts`, and the types for what the
service receives (repository, books and users services, events,
transaction) are at the top of the service. No `any`, no `@ts-ignore` and
no `as`.

20 errors in total:

| | Count |
|---|---|
| Real bugs | 1 |
| Missing types | 17 |
| Compiler being awkward | 2 |

Missing types (17): just renaming the file gave 17 `TS7006` / `TS7031`
"implicitly has an 'any' type" errors, one for every parameter.

Real bug (1): `Type 'number | null' is not assignable to type 'number'` on
`finePerDay: book.finePerDay`. A book's fine can be null (bk-9 has none),
but a borrow request's `fine_per_day` can't. Borrowing bk-9 really did
crash with a `PrismaClientValidationError`, so that's a 500. Fixed with
`book.finePerDay ?? DEFAULT_FINE_PER_DAY` (20, same as the database
default). bk-9 can now be borrowed with a fine of 20.

Awkward (2):
- `OPEN_STATUSES` was `string[]` instead of the status union, so it
  couldn't go into `countForMember`. The values were right, TypeScript
  just widened them. Fixed by typing the constant.
- `returnBook` could return `null` because `updateById` can. It can't
  really happen, `getById` checks it first in the same transaction and
  requests can't be deleted. Fixed with the same not found check `update`
  already has.

# Exercise 11 — Typing the layers

## Task 1: Typing the controllers

Installed `@types/express` (and `@types/jsonwebtoken`, since the auth
controller uses it). Renamed the four controllers to `.ts` and typed every
handler as `(req: Request, res: Response)`. None of them use `next`,
Express 5 passes async errors on by itself.

What doesn't work:

- `req.body` has the type `any`. The type is
  `Request<ParamsDictionary, any, any, ParsedQs>` and the third one is the
  body. So `req.body.bookId` compiles even though nothing tells the
  compiler that `validate(createBorrowRequestSchema)` already ran.
- `req.user` and `req.token` don't exist for the compiler:

```
src/controllers/borrowRequests.controller.ts(18,9): error TS2339: Property 'user' does not exist on type 'Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>'.
src/controllers/auth.controller.ts(80,9): error TS2339: Property 'token' does not exist on type 'Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>'.
```

Fix for `req.user`: `src/types/express.d.ts` adds the two fields to
Express's own `Request` interface:

```ts
declare global {
  namespace Express {
    interface Request {
      user?: { sub: string; role: Role; name: string };
      token?: { jti: string; exp: number };
    }
  }
}
```

This is called **declaration merging** (here it's module augmentation, you
add to a type that belongs to another package). It only works because
Express's `Request` is an `interface`, the thing from Exercise 10 Task 3.

They're optional because they only exist after `requireAuth` runs. So
`createBorrowRequest` now has to check `req.user` before using it
(`TS18048: 'req.user' is possibly 'undefined'`), and throws an
`AuthenticationError` if it's missing.

Also had to fix `expiresIn` for `jwt.sign`: its types don't accept any
string, only things like `"15m"`, so I pass the number of seconds from
`config.jwtExpiresInMs` instead. Same expiry as before.

## Task 2: zod and TypeScript together

zod gives the type with `z.infer<typeof schema>`. Renamed the four schema
files to `.ts` and exported a type for each body schema, e.g.:

```ts
export type CreateBorrowRequestBody = z.infer<typeof createBorrowRequestSchema>;
// { bookId: string }
```

`src/types/http.ts` has a small helper so the body type goes into
Express's `Request`:

```ts
export type RequestWithBody<Body> = Request<Record<string, string>, unknown, Body>;
```

and the controllers use it, e.g.
`createBorrowRequest = async (req: RequestWithBody<CreateBorrowRequestBody>, res: Response)`.
Same for create/update book, create/update user, register and login.

Now `req.body` isn't `any` any more. Changing `req.body.bookId` to
`req.body.bookID` gives:

```
error TS2551: Property 'bookID' does not exist on type '{ bookId: string; }'. Did you mean 'bookId'?
```

**Why this is better than writing the type by hand:** the schema is the
only definition. If I add or change a field in the schema, the type
changes with it. With a hand-written type next to it, I could change one
and forget the other, and the compiler would happily trust the type while
zod checks something else. That's the same as `as Book` from Exercise 10:
a type that nobody checks against the real data. Here the type comes from
the thing that does the checking, so they can't drift apart. It also
picks up what zod does to the value, e.g. `available` in the books query
comes out as a `boolean`, not the `"true"` string from the URL.

## Task 3: Typing the layer boundaries

Converted the members repository and service to TypeScript
(`users.repository.ts`, `users.service.ts`), with the types in
`src/types/member.ts`.

- Repository: the rows are Prisma's own types,
  `Prisma.membersGetPayload<{ select: typeof publicSelect }>`, so they match
  the schema. Each method returns a typed result, e.g.
  `findById(id: string): Promise<PublicMember | null>`.
- Service: typed input and output, e.g.
  `create(signUp: SignUp): Promise<PublicMember | null>` and
  `update(id: string, changes: MemberChanges): Promise<PublicMember>`. The
  plain password goes in, but only `passwordHash` goes to the repository.

**Should the repository's type be the same as what the controller sends?**
No. The two types:

```ts
type PublicMember = {
  id: string;
  name: string;
  email: string | null;
  role: Role;
  branch: string;
  joined: string | null;
};

type MemberRecord = PublicMember & { passwordHash: string | null };
```

- `MemberRecord` is what the repository gives back for logging in
  (`findCredentialsByEmail`), with the hash, so `auth.service` can check
  the password. It should never leave the server.
- `PublicMember` is what the client gets. Everything the service hands to
  a controller is this type.

One thing I found while trying it: TypeScript doesn't remove fields. A
`MemberRecord` can be assigned to a `PublicMember` without any error,
because it has all the fields it needs, and `JSON.stringify` still printed
the hash. So the type alone doesn't protect anything. What actually keeps
the hash out is the repository only selecting `password_hash` in
`findCredentialsByEmail`, and `authenticate` removing it before returning.
The two types make that visible: anywhere `MemberRecord` shows up, it's
the one that has the hash.

Also: the role comes from the database as a plain string, so `toRole`
checks it's one of the three before calling it a `Role`.

## Task 4: Narrowing

**Book or null** (`src/utils/shelfLabel.ts`). First version used `book`
straight away and got `error TS18047: 'book' is possibly 'null'.` three
times. Fixed with a plain check, no `as` and no `!`:

```ts
export const shelfLabel = (book: Book | null): string => {
  if (book === null) {
    return "Not in the catalogue";
  }
  return `${book.title}: ${book.onShelf} of ${book.totalCopies} on the shelf`;
};
```

After the `if`, TypeScript knows `book` is a `Book`, so the second return
compiles.

**Roles** (`src/utils/roles.ts`). We have three roles in the database, not
four: `user`, `librarian`, `admin`. `homePageFor(role)` returns a
different page for each. With the `admin` case left out:

```
error TS2366: Function lacks ending return statement and return type does not include 'undefined'.
```

That works, but only because the function returns a string. A function
that returns nothing wouldn't complain, so it isn't reliable.

**Making it exhaustive:** a `default` that assigns the role to `never`:

```ts
default: {
  const unhandled: never = role;
  throw new Error(`No home page for role: ${unhandled}`);
}
```

When every role has a case, nothing is left for `default`, so `role` is
`never` there and it compiles. To test it I added `"super admin"` to the
`Role` union (it already appears in the logout route):

```
src/utils/roles.ts(12,13): error TS2322: Type '"super admin"' is not assignable to type 'never'.
```

So a new role is a compile error that names the missing one, instead of
quietly falling through. The `throw` is only there in case a role that
isn't in the type comes in at runtime.

## Task 5: Finding the any

There was no `any` written in the `.ts` files, so I looked for the ones
that come in from libraries:

| Where | What I did |
|---|---|
| `req.app.locals.services`: Express types `locals` as `Record<string, any>`, and every controller used it | Removed. `servicesFor(req)` in `controllers/services.ts` reads it once and returns a real `Services` type. That one line keeps a comment saying why. |
| `req.cookies` is `any` in Express's types | Removed. `refreshTokenCookie(req)` takes it as `unknown` and only returns it if it's a string. |
| `hashPassword` returned `any`, because bcrypt had no types | Removed by installing `@types/bcrypt`. It now returns `string`. |
| `res.json(body: any)` | Stays. It's Express's default for what we send, nothing in our code reads it back. |
| The files still in JS (books and auth services, middleware, other repositories) | Stay for now. Their parameters are `any` until they're converted. |

Taking the `any` off `services` straight away showed 8 errors that had
been hidden:
- 7 times `req.params.id` is `string | string[] | undefined` in Express 5,
  but the services want a `string`. Fixed with an `IdParams` type for the
  `:id` routes.
- logout passed `req.token`, which might be missing. Added the same check
  as `req.user` in Task 1.

Then 2 more on the update bodies: zod's `.optional()` gives
`name?: string | undefined`, but the service types said `name?: string`,
and with `exactOptionalPropertyTypes` those are different. Fixed by letting
the change types take `undefined` (the repositories already skip it).

**What `any` does to the checking.** It's not just "this value isn't
checked". With `services` as `any`, this all compiled:

```ts
const book = await req.app.locals.services.books.getByIdd(req.params.id);
const copies: number = book.title;
surname(book.titel);
return book.anything.at.all();
```

- Everything you get from an `any` is also `any`: its properties, what
  its methods return, and so on. So one `any` at the top spreads through
  the whole function.
- `any` can be assigned to every type. So `book.titel` went into
  `surname(book: Book)` with no error, and the checking inside typed code
  (like `surname`) was fooled too. The `Book` type there was a lie and
  nothing said so.

So it doesn't just switch checking off for one value, it lets unchecked
values leak into the code that is checked. After the change, the same
`getByIdd` mistake gives `Property 'getByIdd' does not exist ... Did you
mean 'getById'?`.

## Task 6: Why both

TypeScript checks the code we write before it runs, and zod checks the
data that arrives while it runs, so each one covers a place the other
can't see. Only zod catches a client sending `{ "bookId": 123 }` or no
`bookId` at all to `POST /borrow-requests`, because that JSON doesn't
exist until the request comes in and the types are gone by then. Only
TypeScript catches the code writing `req.body.bookID` instead of
`req.body.bookId`, or the borrow service putting bk-9's `null` fine into
a field that can't be null, because zod never looks at our code. With
`z.infer` the schema is written once and gives both the runtime check
and the type, so having both costs almost nothing extra.

# Exercise 12 — One repository, many models

## Task 1: The shape on paper

The five methods as they are now in the three repositories:

| Method | Books | Members | Borrow requests |
|---|---|---|---|
| `findAll(query)` | `BookQuery` -> `Book[]` | `MemberQuery` -> `PublicMember[]` | `BorrowRequestQuery` -> `BorrowRequestListItem[]` |
| `findById(id)` | `string` -> `Book \| null` | `string` -> `PublicMember \| null` | `string` -> `BorrowRequest \| null` |
| `create(data)` | new book -> `Book` | `NewMemberRow` -> `PublicMember` | `NewBorrowRequest` -> `BorrowRequest` |
| `updateById(id, changes)` | `string`, book changes -> `Book \| null` | `string`, `MemberRowInput` -> `PublicMember \| null` | `string`, `BorrowRequestChanges` -> `BorrowRequest \| null` |
| `deleteById(id)` | `string` -> `boolean` | `string` -> `boolean` | none |

What stays the same in all three:
- the id is always a `string` (`bk-1`, `m-1000`, `br-100`)
- "not found" is always `null`, never an error
- delete returns `boolean`, it never returns the model

Where the model type shows up (call it `T`):
- `findById`, `create` and `updateById` return `T` (or `T | null`)
- `findAll` returns a list of `T`, except borrow requests, where the list
  item is smaller than the full request (just the member's name and the
  book's title)
- the inputs aren't `T` itself: `create` takes the new data (no `id`, and
  for members `passwordHash` instead of a password), and `updateById`
  takes the same fields but all optional
- each `findAll` has its own query type (books have filters and sort,
  members only paging)

So the interface needs more than one type parameter:

```
Repository<T, New, Query, ListItem = T>
  findAll(query: Query): Promise<ListItem[]>
  findById(id: string): Promise<T | null>
  create(data: New): Promise<T>
  updateById(id: string, changes: Partial<New>): Promise<T | null>
  deleteById(id: string): Promise<boolean>
```

Things that don't fit:
- borrow requests have no `deleteById` (they're history), so delete should be its own piece that books and members add
- the extra methods (`findByIsbn`, `findByEmail`, `changeAvailableCopies`,
  `countForMember`, `findForAuth`) stay on each repository, outside the
  shared interface

## Task 2: The generic interface

`src/repositories/repository.ts`:

```ts
export interface Repository<T, New, Query, ListItem = T> {
  findAll(query: Query): Promise<ListItem[]>;
  findById(id: string): Promise<T | null>;
  create(data: New): Promise<T>;
  updateById(id: string, changes: Changes<New>): Promise<T | null>;
}

export interface DeletableRepository<T, New, Query, ListItem = T>
  extends Repository<T, New, Query, ListItem> {
  deleteById(id: string): Promise<boolean>;
}
```

Delete is split out because borrow requests don't have one (Task 1).

Applied to both:
- Books: converted `books.repository.js` to `.ts`.
  `BooksRepository extends DeletableRepository<Book, NewBook, BookQuery>`
  and adds `findByIsbn` and `changeAvailableCopies`.
- Members: `UsersRepository extends DeletableRepository<PublicMember,
  NewMemberRow, MemberQuery>` and adds `findByEmail`, `findForAuth` and
  `findCredentialsByEmail`.

Each `create...Repository` function is typed to return its interface, so
the object has to match it. Both compile. To check it really holds them
to it, I broke each one on purpose:
- renamed books' `deleteById` to `removeById`:
  `'removeById' does not exist in type 'BooksRepository'`
- made members' `findById` return `Book | null`:
  `Type 'Book' is missing the following properties from type
  'PublicMember': name, email, role, branch, joined`

**What the type parameter does:** `T` is a placeholder for the model. The
interface says "whatever `T` is, `findById` gives back a `T` or null,
`create` gives back a `T`" and so on, without saying what `T` is. When I
write `DeletableRepository<Book, ...>`, every `T` in it becomes `Book`, so
for books it reads as `findById(id: string): Promise<Book | null>`. With
`PublicMember` it becomes the member version. Same rules, written once,
filled in per model. `New` and `Query` work the same way for the input and
the filters, and `ListItem` defaults to `T` unless a repository's list
returns something smaller.

## Task 3: Where the generic interface stops

To add something for one model, that model gets its own interface that
extends the generic one. The generic `Repository<T, ...>` doesn't change,
so the others aren't affected.

Books already had this from Task 2:

```ts
interface BooksRepository extends DeletableRepository<Book, NewBook, BookQuery> {
  findByIsbn(isbn: string): Promise<Book | null>;
  changeAvailableCopies(id: string, change: number): Promise<Book | null>;
}
```

For borrow requests I converted the repository to TypeScript and added
`findOverdue`:

```ts
interface BorrowRequestsRepository
  extends Repository<BorrowRequest, NewBorrowRequest, BorrowRequestQuery, BorrowRequestListItem> {
  countForMember(memberId: string, statuses: BorrowRequestStatus[]): Promise<number>;
  findOverdue(asOf: Date): Promise<BorrowRequest[]>;
}
```

`findOverdue` returns approved requests with a due date before `asOf`.
It takes the date as a parameter so the nightly job can ask about any
day. On the seed data it finds br-101 (due 2026-02-21) and nine others.

While converting it, the `BorrowRequest` type turned out to have
`member.email` as `string`, but the column can be null, so I fixed that.

**When it stops being worth it:** when the shared methods stop being the
same. Borrow requests already need a different list item, have no delete,
and their important queries (`countForMember`, `findOverdue`) are outside
the five. Each difference adds another type parameter or a split
interface, and at some point `Repository<T, New, Query, ListItem>` is
harder to read than the repositories themselves. For the five basic
methods it's worth it. Model-specific queries like `findOverdue` and
`findByIsbn` should stay in that model's own interface.

## Task 4: Breaking the interface on purpose

Guesses are in guesses.md. I wrote two members repositories typed as
`DeletableRepository<PublicMember, NewMemberRow, MemberQuery>`.

Missing `updateById`:

```
error TS2322: Type '{ findAll: ...; findById: ...; create: ...; deleteById: ...; }' is not assignable to type 'MembersRepo'.
  Property 'updateById' is missing in type '{ ... }' but required in type 'DeletableRepository<PublicMember, NewMemberRow, MemberQuery, PublicMember>'.
```

`findById` returning a `Book`:

```
error TS2322: Type 'Promise<Book>' is not assignable to type 'Promise<PublicMember | null>'.
  Type 'Book' is missing the following properties from type 'PublicMember': name, email, role, branch, joined
```

Both fail where the repository is written, not where it's used. Nothing
had to call `updateById` for the first error to show up.

**What an interface is for:** the three repositories that exist today
already work, so the interface doesn't add much for them. It matters for
the next one. When someone adds a fourth model next year, the interface
tells them what it has to have, and the compiler stops them the moment
they leave a method out or return the wrong thing, before any service
calls it. It's also what lets code be written against "a repository"
without knowing which one, like the fakes from Exercise 9: as long as a
new one fits the interface, the services and tests built on it keep
working.

## Task 5: The two changes together

On their own each one only does half the job:
- Passing the repository in lets me swap in a fake, but nothing checks
  the fake is right. The fakes in `test/fakeRepositories.js` are plain JS.
  If the real repository changes, or a fake misses a method or returns
  the wrong shape, the test still runs and either crashes or passes for
  the wrong reason.
- Typing the repository checks the real one, but if the service built its
  own repository there'd be nothing to swap.

Together, any object can be handed to the service, and the compiler makes
sure it's a real `BorrowRequestsRepository`. A fake has to have the same
methods and return the same types as the real one, and if the interface
changes, every fake that no longer fits stops compiling. So the fakes stay
honest.

The test I could now write in five minutes: **approving a request when
the book has no copies left**. Typed fakes for the books and borrow
request repositories, bk-2 with `onShelf: 0` and one pending request for
it. Call `borrowRequests.update(id, { status: "approved" })` and check it
throws the `NO_COPIES_AVAILABLE` error and the request is still
`pending`. If a fake is missing a method or returns the wrong type, it
won't compile.

On Monday that meant the real database: set a book's copies to 0 by
hand, create a request for it, approve it, check the copy count and the
request status, then put the copies back or reseed.

# Exercise 13 — Due dates and the nightly job

## Task 1: Due dates

The due date is now set when a request is approved, not when it's
created. A pending request has `dueDate: null`, and approving sets it to
today + `LOAN_PERIOD_DAYS` (new in config, default 14). Both
`PATCH /borrow-requests/:id` and `POST /:id/approve` go through the same
service method, so both do it.

It's stored in `due_on`, which is a Postgres `date`, not a string.

**Time zones.** I checked what the database does:
- A `date` column has no time and no zone. `2026-11-14` stays
  `2026-11-14` whatever the session time zone is (I tried it with the
  session set to UTC).
- Postgres here runs in `Asia/Karachi`, but `CURRENT_DATE` uses the
  server's zone, so on a UTC server it would be a day behind between
  midnight and 5 AM Karachi time.

The real problem was in our code. "Today" came from
`new Date().toISOString().slice(0, 10)`, which is the UTC date. At 2 AM in
Karachi on 2 November that gives `2026-11-01`. Now "today" is worked out
with `Intl.DateTimeFormat` in `LIBRARY_TIME_ZONE` (Asia/Karachi), so it's
the library's date wherever the server is. There's a test for it: at 2 AM
Karachi time on 2 November, a request is created on `2026-11-02` and
approving it gives `2026-11-16`.

**What "due on the 14th" means**

**Decision: due on the 14th means by the end of the 14th, Karachi time.**
The member can bring it back any time on the 14th. It becomes overdue at
00:00 on the 15th in Karachi, wherever the server is.

- The due date is a plain date (`due_on` is a Postgres `date`), with no
  time and no time zone. "The 14th" is a day on the library's calendar,
  not a moment.
- "Today" is always worked out in `LIBRARY_TIME_ZONE` (Asia/Karachi), never
  from the server clock's date or from UTC.
- Overdue: `due_on < today`. So on the 14th it isn't, on the 15th it is.
- Fines: one fine per full day after the due date. Returned on the 15th
  is 1 day late, on the 16th is 2 days. Returned on the 14th, no fine.

Why not the start of the day: a book due on the 14th would be overdue the
moment the 14th starts, which isn't what a member reading "due on the
14th" expects. Why not an exact time: the library counts days, not hours,
and an exact time brings the time zone back into every comparison.

`findOverdue` now takes the library's date and uses `due_on < today`, so
br-101 (due 2026-02-21) isn't overdue on the 21st and is on the 22nd.

## Task 2: Scheduling the job

Installed **node-cron 4.6.0** (it comes with its own types).
`src/jobs/scheduler.ts` schedules a `due-reminders` job, and `server.js`
starts it once the server is listening, so scripts and tests never start
it. For now the job only logs.

The schedule is `DUE_REMINDER_SCHEDULE` in config (default `0 8 * * *`,
8 AM every day), checked with `cron.validate` at startup. The time zone is
passed explicitly as `timezone: config.libraryTimeZone` (Asia/Karachi).

To prove it works I ran the server with
`DUE_REMINDER_SCHEDULE="*/10 * * * * *"`:

```
[due-reminders] scheduled "*/10 * * * * *" (Asia/Karachi), next run 2026-11-02T07:23:40.000Z
[due-reminders] ran at 2026-11-02T12:23:40.000+05:00
[due-reminders] ran at 2026-11-02T12:23:50.000+05:00
[due-reminders] ran at 2026-11-02T12:24:00.000+05:00
```

With the real schedule it says the next run is `2026-11-03T03:00:00Z`,
which is 8 AM in Karachi. With `timezone: "UTC"` the same expression runs
at 8 AM UTC, which is 1 PM in Karachi. Without a time zone it uses the
server's, which is only right here because my laptop is in Karachi.

While doing this I found that `config.js` passes each variable to the
schema by name, and I hadn't added the new ones from Task 1, so
`LOAN_PERIOD_DAYS` and `LIBRARY_TIME_ZONE` were always their defaults.
They're added now.

**The five fields** of `0 8 * * *`, left to right:

| Field | Here | Means | Allowed |
|---|---|---|---|
| minute | `0` | at minute 0 | 0-59 |
| hour | `8` | at 8 AM | 0-23 |
| day of month | `*` | every day of the month | 1-31 |
| month | `*` | every month | 1-12 or JAN-DEC |
| day of week | `*` | every day of the week | 0-7 or SUN-SAT (0 and 7 are Sunday) |

`*` means "every", `*/10` means "every 10th", `1-5` is a range and `1,3`
is a list. So `30 9 * * 1-5` is 9:30 on weekdays. node-cron also allows
an optional sixth field at the front for seconds, which is what
`*/10 * * * * *` uses. The usual cron format has only five.

## Task 3: Sending the reminders

The job now calls one service method and nothing else:

```ts
const { dueOn, sent } = await services.reminders.sendDueReminders();
```

`services` is the same object `server.js` gives to Express and the socket
server. There's no Prisma import in `src/jobs/` or in the reminders
service.

- `reminders.service.ts`: works out today in Karachi, adds 2 days, asks
  `borrowRequests.findDueOn(dueOn)` for the loans, and for each one saves a
  notification and logs a line.
- `borrowRequests.service` got `findDueOn(date)`, and the repository got
  the query behind it: approved requests whose `due_on` is that date.
- New `notifications` table (migration `notifications`): member, borrow
  request, kind (`due-reminder`), message and `created_at`, with its own
  repository. The seed script clears it like refresh tokens.

To try it I approved two loans for m-test, moved one's due date to
2026-11-04 (two days from today), left the other at 2026-11-16, and ran
the job every 10 seconds:

```
[due-reminders] started at 2026-11-02T12:57:50.000+05:00
[due-reminders] reminded Test User (m-test) about br-1184: "Hyperion" is due back on 2026-11-04.
[due-reminders] finished: 1 reminders for loans due 2026-11-04
```

Only br-1184 got a reminder, and the row is in `notifications`. It ran
again 10 seconds later and stored the same reminder a second time, so
running twice isn't safe yet.

## Task 4: When the job goes wrong

Guesses are in guesses.md. What actually happens:

1. **Restarted at 8:59.** Fine if it's back before 9:00. node-cron sets
   the schedule again on startup and runs at 9:00. If startup takes past
   9:00, that day is missed (same as case 2).
2. **Down all morning, back at 11.** The 9:00 run never happens. node-cron
   only lives in memory, so when the server starts at 11 the next run it
   shows is tomorrow at 9:00. Members due in two days get no reminder,
   and nothing says so. **Real problem.**
3. **Still running when the next one is due.** I tried it with a job that
   takes 2.5 s on a 1 s schedule. With `noOverlap: true` (what we use) the
   next run is skipped. Without it, they run at the same time (2, then 3
   at once). For a daily job this only happens if a run hangs for a day,
   and then the next day is skipped.
4. **Two servers.** Both run at 9:00. I ran two servers on a 10-second
   schedule and got 2 identical reminders for the same loan. **Real
   problem.**

**Fix for running twice:** the job is now **idempotent**, running it again
does nothing extra. Every notification has a `for_date` (the due date it
reminds about), and the table has a unique rule on
`(request_id, kind, for_date)`. The repository's `createOnce` returns
`null` when that row already exists, and the service counts it as already
sent. Because it's the database that refuses the second copy, it also
covers two servers running at the same moment. With two servers and four
runs:

```
server A: reminded Test User (m-test) about br-1188: "Hyperion" is due back on 2026-11-04.
server A: br-1188 already reminded for 2026-11-04, skipped
server B: br-1188 already reminded for 2026-11-04, skipped
server B: br-1188 already reminded for 2026-11-04, skipped
notification rows: 1
```

**What I'd do in production:**
- Missed runs (case 2): save each run in a `job_runs` table. On startup,
  if today's run is missing and it's past 9:00, run it straight away. That
  is safe now because the job is idempotent.
- Two servers (case 4): duplicates can't happen any more, but both still
  do the work. Better to have one of them run it: a Postgres advisory lock
  at the start of the job, a `JOBS_ENABLED` setting that's on for only one
  server, or a separate worker process for jobs.
- A run that hangs (case 3): a timeout on the run (node-cron has
  `executeTimeout`), plus logging how long each run took, so a stuck run
  shows up instead of quietly skipping the next day.

## Task 5: Making the job visible

First I threw an error inside the job with the old code. The server
survived, but only because node-cron catches it and prints it with its
own logger. There was a "started" line from us and then nothing: no
finish, no failure, in a different format. So it was safe by accident,
depending on a library default.

What I changed:
- `src/jobs/runJob.ts` wraps every job. It logs `started`, then either
  `finished in Xms` with the counts, or `FAILED after Xms` with the error.
  It catches everything and never rethrows, so nothing from a job can
  reach the process `unhandledRejection` handler, which would exit the
  server.
- `sendDueReminders` returns `found`, `sent`, `alreadySent` and `failed`.
  Each loan has its own try/catch, so one loan that fails is logged and
  counted, and the rest still get their reminder.

A normal run, with two loans due in two days:

```
[due-reminders] started
[due-reminders] reminded Test User (m-test) about br-1190: "Hyperion" is due back on 2026-11-04.
[due-reminders] reminded Test User (m-test) about br-1191: "The Sea and the Salt" is due back on 2026-11-04.
[due-reminders] finished in 252ms: dueOn=2026-11-04 found=2 sent=2 alreadySent=0 failed=0
```

Then I put `throw new Error("deliberate test crash")` at the start of
`sendDueReminders` and ran it every 10 seconds:

```
[due-reminders] started
[due-reminders] FAILED after 1ms: Error: deliberate test crash
    at Object.sendDueReminders (.../src/services/reminders.service.ts:28:11)
[due-reminders] started
[due-reminders] FAILED after 0ms: Error: deliberate test crash
```

While it kept failing, `GET /api/v1/books` still returned 200, and the
next run still started on time. Then I took the `throw` out again.

One thing the wrapper can't catch: a promise inside the job that isn't
awaited. If it rejects, it goes straight to `unhandledRejection` and the
server exits. So everything inside a job has to be awaited.

## Task 6: Running it by hand

I went with an admin-only route: `POST /api/v1/jobs/due-reminders/run`
(`requireAuth` + `requireRole("admin")`).

Why a route and not a script:
- For the demo it's one request from Postman, and the response shows what
  happened. The panel doesn't need to watch a terminal.
- Once it's deployed next week I may not have a shell on the server, but
  I'll always have the API.
- It runs in the same server as the cron job, through the same `runJob`
  and `services.reminders.sendDueReminders()`, so the logs look the same.
  The log line says who ran it.

It's safe to run any time because the job is idempotent (Task 4): running
it after the 9 AM run, or twice in a row, doesn't send anything twice.

```
admin, 1st:  200 {"data":{"dueOn":"2026-11-04","found":1,"sent":1,"alreadySent":0,"failed":0}}
admin, 2nd:  200 {"data":{"dueOn":"2026-11-04","found":1,"sent":0,"alreadySent":1,"failed":0}}
member:      403 FORBIDDEN
no login:    401 UNAUTHORIZED
```

If the job fails, the route returns 500 `JOB_FAILED` and the error is in
the server log, same as when cron runs it.

# Exercise 14 — Fines, and the queue for Dune

## Task 1: The fine calculation

`calculateFine` in `src/services/fines.ts` is a pure function. It takes
the due date, when the book came back (or `null`), an `asOf` time, and
the rules (rate, max days, time zone), and returns a number. It doesn't
read the clock or the database.

The rate comes from the loan's `finePerDay`, which is the book's own rate,
or `FINE_PER_DAY` from config (20) if the book has none. That replaces
the hard-coded 20 in the borrow service. The max is `FINE_MAX_DAYS` (30).

What I decided for the questions the rule doesn't answer (also written as
comments above the function):
- **The due day doesn't count.** Due on the 14th means it can come back
  any time on the 14th, same as the decision in Exercise 13.
- **Weekends count.** The rule is per day late, and the book is out on
  Saturday and Sunday too.
- **There's a maximum:** 30 days of the rate, so a lost book doesn't grow
  forever.
- **Two hours late is one day.** Days are counted on the Karachi
  calendar, so any time on the 15th is the first late day.
- **Never returned:** counted up to `asOf`, so the caller can ask what it
  comes to today.

The return time is turned into a Karachi date first, which is what makes
the midnight cases work.

Test table (`test/fines.test.js`), due Saturday 2026-11-14, Rs 20 a day:

| Case | Returned | Fine |
|---|---|---|
| early | 10 Nov | 0 |
| on the due day | 14 Nov 12:00 | 0 |
| last minute of the due day | 14 Nov 23:59 | 0 |
| one minute past midnight | 15 Nov 00:01 | 20 |
| two hours late | 15 Nov 02:00 | 20 |
| 00:01 Karachi, but still the 14th in UTC | 14 Nov 19:01 UTC | 20 |
| weekend: due Saturday, back Monday | 16 Nov | 40 |
| nine days late | 23 Nov | 180 |
| very late | 1 Feb 2027 | 600 (capped) |
| never returned, asked on 20 Nov | not returned | 120 |
| never returned, asked before it's due | not returned | 0 |
| never returned, asked a year later | not returned | 600 (capped) |

All 12 pass.

## Task 2: Store the fine or compute it on read

The decision is in decisions.md: compute it on read while the book is
out, and store it once when it comes back. It's the same reasoning as the
Week 6 available-copy count: a stored number that something else keeps
updating can drift, and nobody reading the code knows it's being changed.
The member's screen for both designs is in the table there.

## Task 3: The queue

The queue is part of borrow requests, with new statuses: `queued` (in the
queue), `held` (a copy is waiting for them until `holdUntil`),
`cancelled` (left the queue) and `expired` (didn't collect). New columns
`queued_at` (the exact time, because `requested_on` is only a date) and
`hold_until`, and the status CHECK allows the new values.

- **Joining:** creating a request for a book with no copy on the shelf
  makes it `queued` instead of `pending`. Approving a pending request when
  the copies have run out also puts it in the queue instead of failing
  with `NO_COPIES_AVAILABLE`.
- **Leaving:** `POST /borrow-requests/:id/cancel`. Only your own request
  (403 otherwise), and only while it's pending, queued or held (409
  otherwise).
- **Position:** `GET /borrow-requests/:id/queue` counts the queued requests
  for the same book that joined earlier, plus one.
- **A copy comes back:** `returnBook` gives it to the first in the queue,
  ordered by `queued_at`. That request becomes `held` for `HOLD_DAYS` (3)
  and a `hold-ready` notification is stored, in the same transaction. The
  shelf count only goes up if nobody is waiting. Approving a `held`
  request doesn't take another copy, because it already has one.
  Approving a request that's still `queued` is a 409 `REQUEST_QUEUED`.
- **Not collected:** the `expire-holds` job (00:05 every night) expires old
  holds and passes the copy to the next in line.

**What "gets it" means**

**Decision: held for a fixed window, 3 days (`HOLD_DAYS`).** When a copy
comes back it doesn't go on the shelf. It's held for the first member in
the queue until the end of the third day (Karachi time, the same way due
dates work), and they get a notification.

- Not held indefinitely: if the member never comes, the copy sits behind
  the desk forever while everyone else waits.
- Not just notified first: whoever gets to the library first takes it, so
  being first in the queue means nothing.

**If they don't come:** a job at 00:05 every night (`HOLD_EXPIRY_SCHEDULE`)
marks holds that are past their date as `expired`, and the copy goes to
the next member in the queue, who gets their own 3 days. If the queue is
empty, it goes back on the shelf. The member who didn't come loses their
place. They can join again, at the back.

`db/dune-queue.js` runs the whole story through the services:

```
1. all copies out: 3 more loans, Dune on shelf = 0
2. four join: Sara queued #1, Usman queued #2, Test queued #3, Aisha queued #4
3. Usman leaves: Sara queued #1, Usman cancelled, Test queued #2, Aisha queued #3
4. approving Test while queued: REQUEST_QUEUED
5. a copy comes back: Sara held until 2026-11-07, Dune on shelf = 0
   notification: A copy of "Dune" is held for you until 2026-11-07.
6. Sara doesn't come (hold set to end 2026-11-03), expire job: {"checked":1,"expired":1}
   now: Sara expired, Usman cancelled, Test held, Aisha queued #1
7. Test collects it: approved, due 2026-11-18, Dune on shelf = 0
```

Queued and held requests count towards the 5-request limit, since they're
still open requests.

## Task 4: The race condition

**On paper.** Sara is first, Test is second, and one copy is returned. The
return is clicked twice, or two librarians scan it at once, so two
returns run at the same moment, each in its own transaction:

| | Return 1 | Return 2 |
|---|---|---|
| 1 | reads the loan: `approved` | reads the loan: `approved` |
| 2 | finds the next in the queue: Sara | finds the next in the queue: Sara (return 1 hasn't committed) |
| 3 | sets Sara to `held` | sets Sara to `held` |
| 4 | marks the loan `returned`, commits | marks the loan `returned`, commits |

Both "worked". If the second one reads the queue just after the first one
commits, it skips Sara and holds Test too: two holds for one copy. With
nobody queued, both add 1 to the shelf. And when two different copies come
back at the same moment, both pick Sara, so Sara is held twice and the
second copy disappears.

I tried the last case on the old code (`db/queue-race.js`, two returns
with `Promise.all`):

```
B. two copies back at once, Sara and Test queued: ok / P2039 (25P02 current transaction is aborted, commands ignored until end of transaction block) -> Sara held, Test queued, Dune on shelf = 0
```

Both returns picked Sara. The second one only failed because the
`hold-ready` notification for Sara already existed. The unique rule from
Exercise 13 stopped the insert, and in Postgres an error inside a
transaction aborts the whole transaction. Without that rule, Sara would
have been held twice and the copy would have been lost with no error.

**What stops it** is the same tool as Week 6 (Exercise 5): make the
database decide, inside the transaction, instead of reading first and
writing after.
- **Each loan is returned once.** The return is a conditional update:
  `UPDATE ... SET status = 'returned' WHERE api_id = ? AND status = 'approved'`.
  If two run at once, Postgres locks the row, the second waits, and when
  it runs, the status isn't `approved` any more, so it updates 0 rows and
  gets `409 ALREADY_RETURNED`. Only the one that won releases the copy.
  All status changes (approve, cancel, expire) work this way now
  (`updateIfStatus`), and a lost race is `409 REQUEST_CHANGED`.
- **Each copy goes to a different person.** Picking the next in the queue
  and holding them is one statement, with `FOR UPDATE SKIP LOCKED`:

```sql
UPDATE book_requests SET status = 'held', hold_until = $2
WHERE request_id = (
  SELECT r.request_id FROM book_requests r JOIN books b ON b.book_id = r.book_id
  WHERE b.api_id = $1 AND r.status = 'queued'
  ORDER BY r.queued_at, r.api_id
  LIMIT 1
  FOR UPDATE OF r SKIP LOCKED
)
RETURNING api_id
```

  The first transaction locks Sara's row. The second skips it and takes
  Test.
- The notification insert is `ON CONFLICT DO NOTHING` now, so a duplicate
  doesn't abort the transaction.

After the fix, three runs in a row:

```
A. same loan returned twice at once, nobody queued: ok / ALREADY_RETURNED -> Dune on shelf = 1
B. two copies back at once, Sara and Test queued: ok / ok -> Sara held, Test held, Dune on shelf = 0
```

## Task 5: Real-time events for the queue

These follow the table from Exercise 5 Task 6. The service emits domain
events and the socket server turns them into socket messages, so a change
made by the nightly job or a script goes out the same way as one made over
HTTP. Events emitted inside a transaction only go out after it commits
(the held events from Exercise 8), so a rolled back promotion is never
announced.

| Event | When the service emits it | Room | Payload |
|---|---|---|---|
| `server:queue:position-changed` | someone joins (just them), leaves or is promoted (everyone behind them) | `member:<memberId>` | `{ bookId, position }` |
| `server:queue:promoted` | a copy comes back, or a hold is given up or expires, and the next member gets it held | `member:<memberId>` and `counter` | `{ bookId, bookTitle, holdUntil }` |
| `server:book:availability-changed` | a copy goes back on the shelf because nobody is waiting | `book:<bookId>` | `{ bookId, available }` |

The `member:<memberId>` room from the table didn't exist yet, so every
socket now joins its own member room on connect. Positions go to each
member separately, so nobody sees who else is in the queue. A copy that
gets held doesn't send an availability event, because the shelf count
doesn't change.

I connected Sara, Test, Usman (watching Dune) and the admin, and ran the
queue over HTTP:

```
--- Sara joins
sara  got server:queue:position-changed {"bookId":"bk-1","position":1}
--- Test joins
test  got server:queue:position-changed {"bookId":"bk-1","position":2}
--- Sara leaves
test  got server:queue:position-changed {"bookId":"bk-1","position":1}
--- Sara joins again
sara  got server:queue:position-changed {"bookId":"bk-1","position":2}
--- a copy comes back
test  got server:queue:promoted {"bookId":"bk-1","bookTitle":"Dune","holdUntil":"2026-11-07"}
admin got server:queue:promoted {"bookId":"bk-1","bookTitle":"Dune","holdUntil":"2026-11-07"}
sara  got server:queue:position-changed {"bookId":"bk-1","position":1}
--- Test gives up the hold
sara  got server:queue:promoted {"bookId":"bk-1","bookTitle":"Dune","holdUntil":"2026-11-07"}
admin got server:queue:promoted {"bookId":"bk-1","bookTitle":"Dune","holdUntil":"2026-11-07"}
--- Sara gives up the hold too, nobody left
usman got server:book:availability-changed {"bookId":"bk-1","available":1}
```

Each member only got their own events, and Usman, who was only watching
the book, only heard about it when a copy actually went back on the
shelf.

Fines have no event of their own. The table already left them out: a fine
is worked out when the member opens their account (Task 2), so there is
nothing to push.

## Task 6: The demo, end to end

The demo page is `public/queue-demo.html`. A member sees their place in
the queue for Dune with Join and Leave buttons, and a banner when a copy
is held for them. A librarian sees the copies that are out with a Return
button, the queue and the hold shelf. `npm run demo:queue` resets the data
and lends out every copy of Dune.

To make it work every time and not just most times:
- The page doesn't rely on events alone. Every event and every socket
  reconnect makes it ask the API for the current state, so a missed or
  late event can't leave the screen wrong.
- After logging in, the page only draws once, when the socket connects.
  Drawing twice could replace the Return button just as it was clicked.
- The login rate limiter allows 5 logins per account in 15 minutes, so
  rehearsing many times in a row can lock the demo accounts. Restarting
  the API resets it.

# Exercise 15 — Four roles, and ship it

## Task 1: The permission matrix

"Own" means only their own record. Logged-out visitors can browse the
catalogue, register and log in, and nothing else.

| # | Operation | User | Librarian | Admin | Super admin |
|---|---|---|---|---|---|
| | **Catalogue** | | | | |
| 1 | Browse and search books | yes | yes | yes | yes |
| 2 | View one book | yes | yes | yes | yes |
| 3 | Add a book | no | yes | yes | yes |
| 4 | Edit a book (details, copy counts) | no | yes | yes | yes |
| 5 | Remove a book | no | no | yes | yes |
| | **Borrowing and the queue** | | | | |
| 6 | Request a book / join its queue | yes | yes | yes | yes |
| 7 | See borrow requests | own | all | all | all |
| 8 | See queue position | own | all | all | all |
| 9 | Leave the queue / cancel a request | own | own | own | own |
| 10 | Approve or reject a request | no | yes, not own | yes, not own | yes, not own |
| 11 | Change a request's due date | no | yes | yes | yes |
| 12 | Mark a book as returned | no | yes | yes | yes |
| | **Fines** | | | | |
| 13 | See fines | own | all | all | all |
| 14 | Waive a fine | no | no | yes | yes |
| | **Members** | | | | |
| 15 | See a profile | own | all | all | all |
| 16 | See the member list | no | yes | yes | yes |
| 17 | Edit own name, email, password | yes | yes | yes | yes |
| 18 | Edit another member's details | no | no | yes | yes |
| 19 | Deactivate a member | no | no | yes | yes |
| 20 | Make someone a user or librarian | no | no | yes | yes |
| 21 | Make someone an admin or super admin | no | no | no | yes |
| 22 | Edit, demote or deactivate an admin or super admin | no | no | no | yes |
| 23 | Change your own role | no | no | no | no |
| | **Jobs and live events** | | | | |
| 24 | Run the reminder job by hand | no | no | yes | yes |
| 25 | Get live updates for a book | yes | yes | yes | yes |
| 26 | Get own queue and hold updates | yes | yes | yes | yes |
| 27 | Get counter updates (new requests, holds) | no | yes | yes | yes |
| 28 | Approve or reject over the socket | no | yes, not own | yes, not own | yes, not own |

**The three debatable cells:**

1. **Can staff borrow books (row 6)?** Yes. Librarians and admins are
   library members too, and telling them to keep a second account just to
   borrow is how shared logins start. But nobody approves their own
   request (row 10): another member of staff has to. That's the same
   problem as the self-approve bug from Exercise 7, one level up.
2. **Can a member mark their own book returned (row 12)?** No. The book
   isn't back until someone at the desk has it in their hands. If the
   member can press "returned", the copy goes to the next person in the
   queue while it's still in the member's bag. The code allows this today.
3. **Can an admin manage another admin (row 22)?** No, only a super admin
   can. Otherwise two admins can demote or deactivate each other, and one
   bad admin account can lock everyone else out. Admins manage members
   and librarians, the super admin manages admins. Nobody changes their
   own role (row 23), so the last super admin can't remove themselves by
   mistake.

**Where the code doesn't match yet** (for Task 2):
- `super admin` isn't a role: the database CHECK and the `Role` type only
  have three, and only the logout route mentions it.
- Members can return books and see every member's borrow requests.
- Only `user` can create a borrow request, and anyone allowed to approve
  can approve their own.
- Editing and deactivating members is admin-only for everyone, so an admin
  can change another admin or make someone an admin.

## Task 2: Roles and ownership

Every route uses `requireRole` from Week 5, with the four roles from the
matrix, e.g. `requireRole("librarian", "admin", "super admin")` on
returning a book. The role it checks comes from the database, not from the
token: `requireAuth` loads the member on every request
(`findForAuth`) and puts their current role on `req.user`. So a role
change takes effect straight away with the same token. With one member
token, `GET /users` was 403, then 200 after the super admin made them a
librarian, then 403 again after they were changed back.

`super admin` also had to be added to the database CHECK, the `Role` type
and the zod schema. The exhaustive `switch` in `homePageFor` (Exercise 11)
stopped compiling until it had a case for it.

**Ownership.** Two members both have the role `user`, so a role list
can't tell them apart. `cancel(id, memberId)` in the borrow requests
service loads the request and compares its `userId` with the member
asking, and throws a `ForbiddenError` (403) if they're different. Sara
cancelling m-test's request gets
`403 "You can only do this to your own request."`, and m-test cancelling
it works. The other ownership rules from the matrix are done the same way
in the services: a member only sees their own requests and profile, staff
can't approve their own request, only a super admin can change an admin,
and nobody changes their own role.

**Where the check belongs: the service.**
- Middleware only has the request. To know who owns borrow request
  br-1203 it would need its own database lookup for every kind of record,
  and it would be one more place that knows the rules.
- The controller is HTTP only (Exercise 7). If the check were there, the
  socket server and the jobs, which call the service directly, would skip
  it.
- The service already loads the request to cancel it, so the check is one
  comparison on data it has. It applies to every caller (HTTP, socket,
  scripts), and it throws a domain error that the error handler turns
  into 403.

So the split is: `requireRole` in the route answers "can this role ever do
this?", and the service answers "can this member do it to this record?".

## Task 3: The matrix on socket events

The socket events compared with the matrix:

| Event | Who | How it's checked |
|---|---|---|
| `client:borrow-request:decide` | librarian, admin, super admin, never on your own request (row 28) | `authorise(socket, DECIDE_ROLES)` re-checks the token and reads the role from the database, and the service refuses your own request |
| `client:book:watch` / `unwatch` | everyone (row 25) | logged in is enough |
| `client:hello` | everyone | only answers the sender |
| `client:demo:send` with `everyone` or `everyone-else` | staff only | was open to everyone, now `authorise` with the staff roles |
| the `counter` room | librarian, admin, super admin (row 27) | joined when the socket connects |

Two gaps that a role list on HTTP routes doesn't have:
- **Any member could broadcast to every connected socket** with
  `client:demo:send` `{ mode: "everyone" }`. Now only staff can, and
  `only-me` stays open.
- **Rooms are decided once, at connect.** A librarian who was demoted kept
  their socket in the `counter` room, and still got staff events (member
  names on new requests) until the token ran out. Now when a member's role
  changes or their account is deactivated, the users service emits
  `member.access-changed`, and the socket server sends
  `server:session:expired` and disconnects every socket in that member's
  room. They reconnect with the rooms for their new role.

Tested with a user's token, the same script before and after:

| | Before | After |
|---|---|---|
| user emits `client:borrow-request:decide` | `FORBIDDEN` | `FORBIDDEN` |
| user emits `client:demo:send` to everyone | Sara got the message | `FORBIDDEN`, Sara got nothing |
| librarian emits `client:borrow-request:decide` | approved | approved |
| librarian demoted while connected | still connected, still got a counter event | disconnected, no counter events |

## Task 4: Reviewing the deliverable

Checked against the Friday list as if someone else wrote it. To test
"from empty" I made a new empty database, ran the migrations and the seed
on it, and ran the API and Postman against that.

**What holds:**
- Migrations run from an empty database, and the seed gives a working
  library (books, members of all four roles, borrow requests).
- No `.env` is tracked or was ever committed, and the current JWT secret
  isn't anywhere in git history. `.env.example` only has placeholders.
- No password hash in any response: login, register, the user list, one
  user, updating a user, borrow requests (which include the member) and
  the error responses. None in the server log either.
- Prisma only appears in the repositories (and `server.js`, where it's
  wired in). No `req`, `res` or status codes in services or repositories.
- Postman is green on a freshly seeded database.

**What I found:**

1. **Fines can't be demonstrated.** `calculateFine` exists and is tested,
   but nothing calls it. There's no endpoint that shows a member their
   fine, and the fine isn't stored when a book comes back, which is what
   I committed to in Exercise 14 Task 2. Waiving a fine (matrix row 14)
   doesn't exist either.
2. **Reminders can only be seen in the log or the database.** They're
   stored in `notifications`, but there's no endpoint to read them, and
   `server:loan:due-soon` from the real-time table was never built.
   `server:borrow-request:status-changed` is missing too, so a member
   isn't told live when a librarian approves or rejects.
3. **The frontend can't use the protected routes.** `library-web` never
   sends the `Authorization` header and `requireAuth` only reads the
   Bearer token, so its borrow requests page gets 401. This was already
   on the Week 6 list and is still there.
4. **The Postman collection only works once.** It's green on a fresh seed,
   but a second run without reseeding fails 7 assertions (the test book's
   ISBN already exists, m-1000 was deleted). It also needs the API started
   with `JWT_EXPIRES_IN=10s` for the expiry step, and it has nothing for
   the queue, fines, the four roles or the jobs route.
5. **The JWT is still built in the auth controller.** `createAccessToken`
   decides what goes in the token and how long it lasts, which is a rule.
   It was on the Exercise 7 list of worst files and it's still in the
   controller.
6. **The seed has no production guard.** It deletes rows and resets
   passwords, and it now creates a super admin with a password that's in
   the repository. Nothing stops `npm run db:seed` from running with
   `NODE_ENV=production`.
7. **The README is out of date.** It describes Week 6. It doesn't mention
   the queue, the roles and the demo accounts, `npm run demo:queue`,
   `npm test` or `npm run typecheck`, and it says `JWT_EXPIRES_IN=20s` in
   one place and `10s` in another.
8. **Smaller things:**
   - `auth.service.js`, `books.service.js` and two repositories are still
     JavaScript, so the types stop at their boundary.
   - `findOverdue` has no caller. Nothing marks a loan as overdue or shows
     overdue loans to a librarian.
   - The local database uses the default `postgres` password. Fine on a
     laptop, but it can't go to the deployment like that.
   - The login rate limiter (5 per account in 15 minutes) can lock the
     demo accounts if the demo is rehearsed too many times in a row.

## Task 5: Peer review

There was no other trainee to swap with, so my code wasn't reviewed by a
trainee either. It was reviewed by an AI agent that hadn't seen the code
before and was only given the three questions, not my own notes. I
checked its main findings against the code and they were right. There's
nothing under "what I found in theirs" because there was no other
trainee's code to review.

**1. Finding the borrow request rules in 30 seconds.** Yes, from the
folder names alone: `services/borrowRequests.service.ts`, the first file
opened. The limit, the queue and the due date are all in it. What slowed
it down:
- The file is 457 lines, and `update()` mixes approving, rejecting,
  re-queueing and the queue events in one function.
- `BORROW_LIMIT` is hard-coded while the loan period, hold days and fine
  come from config, so the real numbers needed two more files.
- Some rules live elsewhere: the "no copies" check in the books service,
  queue order in raw SQL in the repository, and who may approve in the
  routes and again in the socket server.
- The comment says dates are never taken from the caller, but
  `PATCH /borrow-requests/:id` still accepts `dueDate`, `requestedAt`,
  `userId`, `bookId` and `finePerDay`, and passes them through unless the
  request is being approved.

**2. Naming the layer from the path.** Fine for `routes/`, `middleware/`,
`controllers/*.controller.ts`, `services/*.service.*` and
`repositories/*.repository.*`. Misleading:
- `controllers/services.ts` and `controllers/actor.ts` aren't controllers,
  they're helpers sitting in that folder.
- `services/fines.ts` is a pure function nothing uses, and
  `services/createServices.js` and `repositories/createRepositories.js`
  are the wiring and the transactions.
- `realtime/socketServer.js` is a controller, an auth check and an error
  handler in one file.
- `realtime/events.js` (socket event names) vs `events/domainEvents.js`
  (the internal event bus), and three different kinds of `schema` file.
- `utils/roles.ts`, `shelfLabel.ts` and `surname.ts` are practice files
  from Exercises 10 and 11 that nothing imports.

**3. The same logic in more than one place.**
- **Who counts as staff** is written out in every route, again in the
  socket server (`STAFF_ROLES`, `DECIDE_ROLES`), and again in the users
  service (`isAdmin`). Changing who can approve over HTTP doesn't change it
  over the socket.
- **Status and role lists** are written separately in the types, the zod
  schemas and the repositories. Add a status to one and not the others
  and reads start throwing.
- **Queue position is worked out two ways.** The socket event uses the
  order from `findQueue` (`queued_at`, then `api_id`), but
  `GET /:id/queue` counts only by `queued_at`, so two requests made at the
  same moment can be told different positions. `findNextInQueue` repeats
  the same order and is never called.
- **Sign-up is two routes:** `POST /users` and `POST /auth/register` run
  the same handler, so a fix to one (like rate limiting) misses the
  other.
- **The member's role is built twice.** `findForAuth` checks the role
  from the database, but the refresh token repository builds the same
  member without that check, and that member is signed into a new token.
- **The socket server re-does HTTP pieces**: its own validation errors,
  its own error-to-reply mapping and its own role check, so the same error
  looks different to an HTTP client and a socket client.
- Smaller copies: the due date calculated twice in `update()`,
  date-to-`YYYY-MM-DD` written by hand in four places, and
  "find or throw User not found" three times in the users service instead
  of reusing `getById`.

## Task 6: What might not survive the demo

1. **The queue and what stops two people getting one copy. Risk: I can't
   explain it.** It works, but the reasons are the hardest part of the
   week: the copy going to the first in line inside the same transaction
   as the return, the conditional updates (`WHERE status = 'approved'`),
   `FOR UPDATE SKIP LOCKED`, and events being held until the transaction
   commits. A question like "what happens if two librarians press Return
   at the same moment?" needs an answer without opening the code.

2. **Fines. Risk: it breaks.** The calculation is done and tested, but no
   endpoint or screen uses it and the fine isn't stored when a book comes
   back, so there's nothing to show on a late return.

3. **The live queue demo with two browsers. Risk: it breaks.** The code
   holds up, but the setup around it is fragile. The login rate limiter
   can lock the demo accounts, the data has to be reset just before or
   Sara is already holding the copy, and an access token only lasts 15
   minutes.

None of them is slow. Everything measured answered in well under a
second.
