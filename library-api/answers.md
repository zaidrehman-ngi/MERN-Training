# Week 7

# Exercise 1 — The page that had to be refreshed

## Task 1: Polling the catalogue

I made the catalogue page (`library-web/src/routes/Books.jsx`) fetch the
books again every 3 seconds with `setInterval`, and stop when you leave the
page. Then I left the page open for 5 minutes without changing anything.

To count it I wrote `library-web/scripts/measure-polling.mjs`. It opens the
page in a headless Chrome and listens to the browser's network events (the
same thing as the Network tab in DevTools), so the byte counts are what
really came over the network, headers included. To know if the data had
changed, it compares a hash of each response with the one before.

| In 5 minutes | Result |
|---|---:|
| Catalogue requests | 100 |
| Responses where the data had changed | 1 (the first load) |
| Bytes transferred in total | 108,208 |
| Bytes transferred for nothing | 105,122 |

So 99 out of 100 requests got back exactly the same books, about 1 KB
each time. That's for one open page showing 10 books. With every
librarian's screen open all day it's thousands of useless requests per hour,
and the screen can still be up to 3 seconds out of date.

## Task 2: The arithmetic

My three numbers from Task 1, over 5 minutes:

- **100** requests
- **1** of them returned data that had changed (the first load)
- **105,122** bytes transferred for nothing (about 1,062 bytes per request)

**Forty librarians at 3 seconds.** One page polling every 3 seconds is 20
requests a minute, so 40 librarians is **800 requests per minute**, or
48,000 an hour. From my measurement only about 1 in 100 had new data, and
that one was the first load, so with nothing happening it's closer to 0%
useful. Even on a busy day, if 5 books were checked out every minute, only
about 5 × 40 = 200 of the 800 would see a change, so at best around a
quarter are useful and the rest are the server answering "nothing new". In
bytes it's about 800 × 1 KB, so roughly 0.85 MB a minute or 50 MB an hour
for a catalogue page showing 10 books.

**One second instead of three.** That's 40 × 60 = **2,400 requests a
minute**, three times the load, and still mostly useless. The screen would
be at most 1 second out of date instead of 3, so the 90 second problem gets
a lot smaller, but it doesn't go away. There's still a gap where the first
librarian has checked out the last copy and the second one's screen hasn't
asked yet, and she can still promise it. Making the interval shorter just
trades a smaller gap for more load. It never gets to zero, because the
browser only finds out when it asks. To actually fix it the server has to
tell the screens when something changes, and the checkout itself has to be
checked on the server, so the second librarian's checkout gets refused
even if her screen is out of date.

## Task 3: Four ways to get new data to the browser

| Way | How it works | Direction | Holds a connection open? |
|---|---|---|---|
| **Polling** | The browser asks every few seconds and the server answers straight away, even if nothing changed (what I built in Task 1). | One way: the browser asks, the server answers | No, a new request each time |
| **Long polling** | The browser asks, and the server doesn't answer until there's something new (or a timeout). Then the browser asks again straight away. | One way: updates only come back as answers | Yes, each request stays open until there's news |
| **Server-sent events (SSE)** | The browser opens one normal HTTP request and the server keeps it open and writes events down it whenever something happens. | One way: server to browser only | Yes, one long-lived connection |
| **WebSockets** | The browser upgrades an HTTP connection into a socket, and after that either side can send a message at any time. | Two way | Yes, one long-lived connection |

**The right one for this problem: WebSockets** (with Socket.IO). The
librarian's screen needs to hear "the last copy of Dune just went out" the
moment it happens, and the other ways either waste requests or only go one
way. For the counter, it isn't only the server talking. Each screen also
has to tell the server things, like which book it's looking at so it only
gets that book's updates, and later actions like joining the queue. With
WebSockets that all goes over the same connection. Socket.IO also handles
reconnecting when the Wi-Fi drops, and rooms, which we'll need.

**Where SSE would have been enough:** a member's own notifications, like
"your book is due tomorrow" or "the book you queued for is now available".
The member's browser never needs to send anything back over that
connection; it just listens. If they want to do something about it, like
borrow the book, that can be a normal HTTP request.

## Task 4: The handshake

I made a tiny Node server that accepts an upgrade and sent it a handshake
with curl, to see the real thing. The browser's request is a normal HTTP
`GET`:

```
GET /socket.io/?EIO=4 HTTP/1.1
Host: localhost:3999
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Version: 13
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
```

The header that asks for the upgrade is **`Upgrade: websocket`**, together
with `Connection: Upgrade`. `Sec-WebSocket-Key` is a random value the
server has to answer correctly, to prove it really understands WebSockets.
The server answered:

```
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

**101 Switching Protocols** means "OK, from now on this connection isn't
HTTP any more". `Sec-WebSocket-Accept` is worked out from the browser's key
(SHA-1 of the key plus a fixed string, in base64), so the browser knows the
server did the handshake properly. One thing I noticed: Node didn't send
this request to the normal request handler at all, it went to a separate
`upgrade` event.

**What's still true afterwards:** it's the same TCP connection, on the same
port, started by the same browser, and the cookies and headers from that
first request were sent once and the server can still look at them.

**What isn't:**

- **No more requests and responses.** After the 101, either side can send a
  message at any time. A message doesn't have to be an answer to anything,
  and there can be many in a row from one side.
- **No more status codes.** There's no 200 or 404 for each message. If
  something goes wrong, you have to put that in the message yourself (like
  `{ error: "..." }`). The only codes left are close codes when the
  connection ends (like 1000 for normal close).
- **No more Content-Type.** Messages don't have headers. Each frame is just
  marked as text or binary, and what's inside (JSON or not) is up to us.
- **No headers per message at all**, so there's no `Authorization` header on
  each message like with my HTTP requests. Whatever we know about the user
  comes from that first handshake.

## Task 5: What really needs real-time

**Three things that genuinely need it:**

1. **Copy availability at the counter.** This is the story from the start
   of the exercise. When the last copy of a book goes out, every librarian
   looking at that book needs to know straight away, or two of them promise
   the same copy.
2. **Queue promotion.** When someone returns Dune and the next member in the
   queue is promoted, that member (and the librarian holding the book for
   them) should see it now, not whenever they next refresh. Otherwise the
   book sits on the hold shelf while nobody knows it's theirs.
3. **New borrow requests on the librarian's screen.** A member asks for a
   book online and is waiting for an answer. The librarian's list should get
   the new request as it arrives, instead of the librarian polling or
   refreshing all day.

**Three that look like they need it but don't:**

1. **Fines going up every day.** A fine only changes once a day, so
   pushing it live is pointless. Work it out from the due date when someone
   looks at it (or update it in the nightly job), and show it when the
   member opens their account page.
2. **Due-date reminders.** They feel like notifications, but they're on a
   schedule: "due tomorrow" only needs to be decided once a night. A cron
   job that sends an email or saves a notification is right. The member
   doesn't need to be online to get it.
3. **New books added to the catalogue, and reports like fines per branch.**
   Nobody is harmed if a new book shows up the next time the page loads, and
   a report that the committee looks at once a month doesn't need to change
   while they're reading it. A normal request when the page opens, or a
   refresh button, is enough.

If everything was pushed live, every screen would be changing under people
all the time and it would be much harder to work out why something showed
up or didn't. So I'd only use sockets for the things where a few seconds'
delay causes a real mistake.