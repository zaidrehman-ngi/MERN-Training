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


# Exercise 5 — A room for every book

## Task 4: The librarian counter feed: namespace or room?

**A room.** A namespace is a separate connection to its own endpoint (like
`/librarians`) with its own middleware and handlers, which suits a separate
app. A room is just a group of sockets on the connection the client already
has. Librarians use the same app as members: they browse the same catalogue
and join the same book rooms. So the counter feed is a room called
`counter`, and the server puts a socket in it when it connects, only if its
token's role is librarian, admin or super admin. There's no client event to
join it, so a member can't get in. New borrow requests are announced by the
borrow requests service and the socket server sends them only to that room.
With a **namespace** I'd have gained a clean wall around staff traffic: its
own `io.of("/librarians").use(...)` check that refuses anyone who isn't
staff before they even connect, and staff-only events kept in their own
file. The cost would be a second connection for every librarian (one for
the catalogue, one for the feed) and a second copy of the auth and presence
setup. If the staff side grows into its own admin app, I'd move it to a
namespace then.


# Exercise 6 — The socket nobody authenticated

## Task 3: What happens when a socket's token expires

**Disconnect them when the token expires, and re-check on every privileged
event.**

- **When the token expires**, the server disconnects the socket. At connect
  time it reads the token's `exp`, sets a timer for that moment, sends
  `server:session:expired`, and disconnects. The page gets a new access
  token from `/auth/refresh` (the refresh cookie) and reconnects, and the
  handshake checks the new token like any other. With 15-minute tokens a
  socket is never trusted longer than the token it came with.
- **On every privileged event** (`client:borrow-request:decide`, librarian
  or admin only, the same roles as `PATCH /borrow-requests/:id`), the token
  is checked again with the same `verifyAccessToken` as HTTP. That covers
  expiry, logout, a deleted account, and a role that changed in the
  database. A wrong role gets `FORBIDDEN` in the ack. A token that's no
  longer valid gets `UNAUTHORIZED`, and the socket is disconnected so it has
  to come back with a new one.

**Why not only one of them:**

- **Accept the risk for the socket's lifetime:** a library tab can stay open
  all day. A librarian who was removed would keep the counter feed (member
  names) and could keep approving loans for hours.
- **Only re-check on each event:** that protects actions, but listening
  isn't an event. A socket that never sends anything would keep getting the
  counter feed and book updates long after its token died.
- **Only disconnect at expiry:** a librarian demoted at 10:01 could still
  approve until their token runs out at 10:15. Re-checking privileged events
  closes that.

The re-check is one denylist lookup and one member lookup, the same two
queries every HTTP request already pays. It's only done for privileged
events, not for `watch` or `hello`.

**Risk I'm accepting:** after a logout, or a role change, a socket that only
listens can keep receiving events until its token's expiry, at most 15
minutes. That includes the counter feed: room membership is decided at
connect, so a demoted librarian stays in `counter` until then. Closing that
would mean finding a member's sockets on logout or role change and
disconnecting them. Presence already maps member to sockets, so that's
possible later.
