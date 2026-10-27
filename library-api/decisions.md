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
