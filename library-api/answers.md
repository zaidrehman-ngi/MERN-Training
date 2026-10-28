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

The rules are in `decisions.md` (Exercise 7, Task 2). In short: the
controller knows HTTP, the service knows the library's rules, and the
repository knows the database. **Only the controller may mention `req`,
`res` or a status code, and only the repository may mention Prisma.**

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
layered version splits the M into two, and gives each layer one job (rules
in `decisions.md`):

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

Postman after: 41 requests, 69 assertions, 0 failures. All green.

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

Postman after: 41 requests, 69 assertions, 0 failures.
