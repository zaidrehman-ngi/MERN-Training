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


# Exercise 7 — The four hundred line controller

## Task 2: What each layer is allowed to know about

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

# Exercise 13 — Due dates and the nightly job

## Task 1: What "due on the 14th" means

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

# Exercise 14 — Fines, and the queue for Dune

## Task 2: Store the fine or compute it on read?

**Decision: compute it on read while the book is out. Store it once, when
the book comes back.**

In Week 6 (Exercise 3 Task 5) I had the same choice for the available-copy
count. I said a stored number can drift away from the real data, that
the trigger was the dangerous option because nothing in the code shows it
exists, and I went with computing it on read. A stored fine that the
nightly job updates has both problems:
- It drifts. It's only right just after the job runs. From midnight to
  9 AM it's a day behind, and if the job misses a morning (Exercise 13
  Task 4, server down until 11) it's wrong all day with nothing saying so.
- It's the same hidden-update problem as the trigger. Someone reading the
  return code sees a fine column and doesn't know a job somewhere is
  changing it every night.

While the book is out the fine is `calculateFine(due date, not returned,
now)`. It's a small calculation on data we already load, so there's
nothing to keep in sync.

Once the book is returned the fine stops changing, so I store it then, in
the same transaction as the return. That number is a record of what the
member owes. If the rate in config changes next year, old returns keep
the fine they were charged.

**What the member's screen shows** for a book due 14 Nov, Rs 20 a day,
looked at on 23 Nov at 8 AM:

| | Stored, nightly job | Computed on read |
|---|---|---|
| Book still out | "Fine: Rs 160". That's yesterday's number until the 9 AM run, and older if a run was missed. | "Rs 180 so far, 9 days late, Rs 20 more each day". Always the current amount. |
| Book returned on 23 Nov | Whatever the job last wrote, unless the return code also sets it. Two places writing the same column. | "Rs 180, returned 23 Nov", stored at return and never changes. |

## Task 3: What "gets it" means for the first in the queue

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
