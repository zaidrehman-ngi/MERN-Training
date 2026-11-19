# Exercise 1 — Two applications meet

## Task 1: Both running, Axios pointed at the real API

The API runs on port 3000 and the frontend on 5173. The API's
`CORS_ORIGIN` is `http://localhost:5173`.

The base URL is in `library-web/.env` as
`VITE_API_URL=http://localhost:3000/api/v1`, and `src/api/client.js` reads
it with `import.meta.env.VITE_API_URL`. I added `.env.example` because
`.env` is git-ignored.

Vite only exposes variables that start with `VITE_`, and it writes their
values into the JavaScript bundle, so anyone can read them in dev tools.
That rules out any secret there (JWT secret, database URL, API keys). Those
stay in the backend's `.env`.

## Task 2: The catalogue from the real API

Problems I hit, in order:

1. CORS: the API only allows `http://localhost:5173`. If Vite runs on
   another port the browser blocks it, so the frontend stays on 5173.
2. Shape: the API sends `{ data: [...] }`, the mock sent the array
   directly. The thunk and detail page read `response.data.data`.
3. Field names: the frontend sends `status` and `q`, the API only had
   `available` and `title` (exact match). It ignored the unknown params, so
   filter and search did nothing. I added `q` and `status` to `GET /books`.
4. One book has status `RESERVED_STACK` and the card showed "Status
   unavailable". The card now shows it as "reserved".
5. Paging: the API returns 10 books by default and the catalogue never
   asks for page 2. Not fixed yet, it only matters once there are more
   than 10 books.

## Task 3: Deleting the mocks

Removed:

- `json-server` from devDependencies, and the README steps for it.
- `scripts/measure-polling.mjs` (it measured the old polling).
- The fake borrow request (`userId: "m-1000"` plus dates). It now sends
  only `{ bookId }`.
- `/covers/placeholder.jpg`, which never existed outside json-server.
- The hardcoded branch list on the register page. Added
  `GET /api/v1/branches` and the dropdown loads from it.

What broke after that:

1. Users and Borrow Requests pages gave `401`, the mock never needed login.
2. Borrow, add, edit and delete book need login too.
3. Add Book sends a branch books don't have and no `year` or `finePerDay`,
   so the API returns `400`.
4. The edit form has no year or fine fields.

## Task 4: The four states against the real API

Loading, empty and loaded worked. Error worked on the catalogue too (API
stopped, and a 10 second timeout on a slow API).

What only worked because of the mock:

1. The book page said "Book Not Found" for any error, even with the API
   down. Now only a 404 says that, other errors show a Retry button.
2. A bad id like `bk-1` returns `400`, not `404`. The book page treats it
   as not found.
3. The interceptor turned every 404 into a book message. Now it shows the
   API's own message.

## Task 5: Environment configuration on both sides

| | Local | Production |
|---|---|---|
| `VITE_API_URL` (frontend) | `http://localhost:3000/api/v1` | `https://your-api-host/api/v1` |
| `CORS_ORIGIN` (backend) | `http://localhost:5173` | `https://your-frontend-host` |

Both apps have `.env.example` and `.env.production.example` committed. In
production the values go in the host's dashboard.

To catch a wrong value early, the API won't start if `CORS_ORIGIN` has a
trailing slash or isn't https in production, and `vite build` fails if
`VITE_API_URL` is missing.

# Exercise 2 — Login, for real this time

## Task 1: Registration against the real endpoint

The register page now uses `useForm` (unchanged) and posts to
`/auth/register`.

- Duplicate email: the API gives the same `201` message either way, so the
  form can't be used to find out who has an account. I kept that.
- Backend rejects what the frontend allowed: I added a 72 byte password
  limit to the API (bcrypt ignores anything after that). An email like
  `reg@lib.p` also passes the form but not the API.
- Field errors: the API returns `details: [{ field, message }]`. The form
  shows each message under the input with the same name.

For this to work the two validators have to agree on field names and on the
error shape. The rules can differ, the API has the final say.

## Task 3: Token on every request

The request interceptor in `src/api/client.js` adds
`Authorization: Bearer <token>` when there is a token in memory.

- Logged in as a librarian, `GET /users` goes out with the header and the
  list loads.
- After logout the token is cleared, the same request has no header and
  gets `401`.
- Logout also puts the token on the server's denylist, so a copy of the old
  token gets `401 "This token has been logged out."` too.

## Task 4: Handling the 401

The response interceptor in `src/api/client.js` now handles an expired
token:

- On a `401` it calls `/auth/refresh`, saves the new access token and sends
  the original request again. The user doesn't notice anything.
- If several requests fail at once, they all wait for the same refresh call
  instead of each starting one.
- If the refresh also fails, the token is cleared and the user is sent to
  the login page with "Your session has expired. Please log in again."
  After logging in they go back to the page they were on.

It can't loop because a request is only retried once (it gets a `retried`
flag), requests to `/auth/*` are never retried, and only requests that
were sent with a token trigger a refresh.

I tested it with `JWT_EXPIRES_IN=10s` and `JWT_REFRESH_EXPIRES_IN=30s`.
After 15 seconds the users page still loaded through a refresh. After 45
seconds the next page went to login, and logging in brought me back to it.

## Task 5: Protecting the routes

Added a `RequireAuth` component that wraps routes in the router. If nobody
is logged in it redirects to `/login`, and if the role isn't allowed it
shows "Not allowed".

- `/borrow-requests`: any logged in user
- `/users`, `/books/add`, `/books/:id/edit`: staff only

In Postman, without the frontend, `GET /users` with no token gets `401`,
and with a normal user's token it gets `403`. `POST /books` as a user also
gets `403`.

The API check is the actual security, because anyone can skip the frontend
and call the API directly. The route guard is only for convenience, so
users don't land on pages they can't use.

## Task 6: The full sequence

1. Register a new user on `/register`.
2. Log in with it, which lands on `/books`.
3. Browse the catalogue and open a book.
4. Click Borrow, the button changes to "Request sent".
5. Refresh the page, still logged in.
6. Wait for the token to expire, then open Borrow Requests. It still loads
   and shows the new pending request.
7. Log out.
8. Open `/borrow-requests` again, it goes to the login page.

For the demo I run the API with `JWT_EXPIRES_IN=10s` so step 6 doesn't
take 15 minutes.

# Exercise 3 — The contract was wrong

## Task 1: The mismatches

**Frontend wrong**

- The book form asks for a branch, but books don't have one.
- Add Book never sends `year` or `finePerDay`, which the API requires.
- The borrow request sent `userId` and dates. The API takes the user from
  the token and sets the dates itself.
- Create and update book thunks return `response.data` instead of
  `response.data.data`.
- Books without a cover pointed at `/covers/placeholder.jpg`, which only
  json-server served.

**Backend wrong**

- Register requires `joined` from the client. The server should set the
  join date.

**Spec never said**

- Response shape: the mock returned a plain array, the API returns
  `{ data: [...] }`.
- Pagination: the API returns 10 books by default with no total or page
  info, so the frontend can't tell if there is a page 2.
- Query params: the frontend sent `status` and `q`, the API had
  `available` and `title`. Unknown params were ignored without an error.
- Status values: `RESERVED_STACK` was never listed, so the card didn't
  know it.
- Dates: some fields are `YYYY-MM-DD` (`joined`, `dueDate`), others are
  full ISO timestamps (`queuedAt`, `returnedAt`). Nothing says which, or
  which time zone.
- Error body: the API sends `{ error, message, details }`. The mock had no
  error format, so the frontend made up its own 404 message.
- Ids: the mock used ids like `bk-1`, the API uses UUIDs and returns `400`
  for a bad one, not `404`.
- Field names in general (`onShelf`, `totalCopies`) were never written
  down, each side just guessed.

## Task 2: Fixing them

Rule: the side that owns the data or the rule moves. The API owns the data
and has other clients (Postman, later mobile), so its names and shapes stay
and the frontend adapts. The backend moves only when it is missing
something only the server can know, or when it lets a mistake pass
silently.

The three biggest:

1. **Pagination, backend.** Only the server knows how many books match.
   `GET /books` now returns `{ data, meta: { page, limit, total } }`. `data`
   stays an array so nothing else breaks. The catalogue shows
   "Showing 10 of 25 titles" with Previous and Next.
2. **Add/Edit book form, frontend.** The API's book shape is right, the
   form was built for the mock. Removed the branch field, added `year` and
   `finePerDay` to both forms, and the form now sends only its own fields.
3. **`joined` date, backend.** The client shouldn't decide when someone
   joined. The API sets it to today in the library's time zone and no
   longer accepts it on register.

The rest:

- Thunks for create, update and borrow now read `response.data.data`
  (frontend).
- Unknown query params on `GET /books` now return `400` instead of being
  ignored (backend), so a wrong name shows up right away.
- Dates stay as they are: date-only fields are `YYYY-MM-DD`, timestamps are
  ISO in UTC.

## Task 3: Casing

The database uses snake_case (`total_copies`, `joined_on`), JavaScript uses
camelCase. The translation happens only in the repositories: each one has a
`toBook` / `toUser` style function that turns a row into an object, and
nothing above the repository sees a column name. The repository is the
only layer that knows the database, so it is the only one that should know
its naming.

Then I checked every GET response for keys. All camelCase, but some
endpoints still disagreed:

- Login and refresh returned `{ accessToken, user }` while everything else
  uses `{ data }`. Both now return `{ data: { accessToken, user } }`, and
  refresh returns the same `user` fields as login (it was missing `email`).
- The same person was `userId`, `memberId`, `member` and `memberName`
  depending on the endpoint. The API calls them users, so it's `userId` and
  `user` everywhere now.
- `GET /borrow-requests` returned flat `memberName` and `bookTitle`, while
  the detail and `/overdue` returned nested `user` and `book`. The list
  now uses the same shape as the detail.
- The due-reminder socket event sent `dueOn`, the REST API calls it
  `dueDate`. The socket now sends `dueDate`.

The frontend and the Postman tests were updated for the auth `data`
envelope.

## Task 4: Dates

What arrives in the browser: `dueDate: "2026-11-12"` and
`queuedAt: "2026-11-12T20:30:00.000Z"`. The cards rendered those strings
as they were. The trap is formatting them with `new Date()`:

- `new Date("2026-11-12")` is UTC midnight, so in New York it shows
  11 Nov, a day early.
- `20:30Z` is 01:30 on 13 Nov in Karachi. Shown raw, the member sees the
  wrong time and the wrong day.

Convention:

- The API sends two kinds of dates. A library day (due date, hold until,
  joined) is `YYYY-MM-DD`. A moment in time (queued, returned, created) is
  ISO 8601 in UTC with `Z`.
- The frontend shows a library day exactly as sent and never converts it.
  `formatDay` in `src/utils/dates.js` formats it in UTC so it can't shift.
  A moment in time is converted only for display.

Whose job the time zone is: the library's time zone is the backend's job.
"Today", due dates and overdue are worked out with `LIBRARY_TIME_ZONE`
(`Asia/Karachi`), not the server clock. That matters once it's deployed:
on a UTC server, `toISOString()` would give yesterday between midnight and
5 am in Karachi. The member's own time zone is only a display concern, so
it belongs to the frontend. The API never needs to know it.

## Task 5: The spec

`library-api/api-spec.md` now describes what both apps actually do:
endpoints and roles, the `{ data }` envelope, paging `meta`, error codes,
date formats, auth and refresh, socket events, jobs, and which endpoints
the frontend calls.

What I would do differently:

I would write the spec from real example requests and responses, with
every shape, date format, error body and paging rule written out, instead
of a table of paths that left both sides guessing. I would build one thin
slice end to end (log in, list books, borrow one) in the first week, so
the contract gets tested by both apps before either side builds on top of
it. And I would check the spec automatically, with Postman tests that
assert the documented shapes, so it can't quietly go out of date again.

# Exercise 4 — Four roles, one interface

## Task 1: The current user everywhere

The user is kept in the Redux store (`authSlice`). It gets filled by login
and by the refresh on page load, and cleared by logout or an expired
session. Components read it through one hook, `useCurrentUser()` in
`src/hooks/useCurrentUser.js`. The hook returns `user`, `role`, `status`,
`isStaff`, `isAdmin` and `hasRole(roles)`. `Header` and `RequireAuth` use
it, so no component reads the store directly.

Context or Redux: Redux. In Week 4 my rule was Context for shared data that
is simple, and Redux only when it's needed. The rule still holds, but the
current user isn't simple anymore. It comes from the server through async
login, refresh and logout. It has a status (checking, signed in, signed
out, expired). It can also be changed from outside React: the Axios
interceptor ends the session when a refresh fails, and it can dispatch to
the store but can't set a Context value. So the rule needs one more line:
once a value comes from the server and something outside the component tree
has to change it, it goes in the store.

## Task 2: One interface, four roles

I used the Week 7 permission matrix as it is. It's now in
`src/constants/permissions.js` as a map from action to roles (for example
`"books:delete": ADMIN_ROLES`), plus two helpers for the member rows:
`assignableRoles` and `canManageMember`. Components ask
`can("books:delete")` through `useCurrentUser()` instead of checking role
names.

What each role sees:

- **Logged out:** the catalogue, and "Log in to borrow" on a book.
- **Member:** the catalogue, Borrow (or "Join the queue" when no copy is
  on the shelf), and "My borrow requests" with Cancel on their own waiting
  requests.
- **Librarian:** everything a member sees, plus Add Book and Edit book, an
  "Approval queue" that opens on pending requests with Approve and Reject
  (not on their own requests) and "Mark returned" on approved loans, and
  the member list (read only).
- **Admin:** everything a librarian sees, plus Delete book, a "Send due
  reminders now" button, and "Manage members": change a role to user or
  librarian, or deactivate. Not for themselves, other admins or the super
  admin.
- **Super admin:** everything an admin sees, and can also manage admins
  and give the admin or super admin role.

Two rows of the matrix had no endpoint, so I added them to the API first:

- Row 11, change a due date: staff send `{ dueDate }` to
  `PATCH /borrow-requests/:id`. It only works on a book that is out, and
  the date can't be in the past. Approved loans in the queue show a date
  field for it.
- Row 14, waive a fine: `POST /borrow-requests/:id/waive-fine`, for admins
  only, on a returned loan that has a fine. Admins see "Waive fine" on
  those cards.

## Task 3: Breaking my own interface

Logged in as Sara, a plain member, and tried three things from dev tools.

**1. Changed the role in the store.** I found the Redux store through
React's root element in the console and dispatched
`auth/login/fulfilled` with `role: "librarian"`. The frontend believed
it:

- The nav changed from "Home, Books, My requests" to "Home, Books,
  Approval queue, Add Book, Members".
- `/users` and the Approval queue opened, and the book page showed "Edit
  book".

The server didn't believe it. The Members page showed "You do not have
permission to perform this action." and the Approval queue showed none of
the other members' requests, because the API only returns your own to a
`user`.

**2. Called the API from the console** with Sara's real token (its role is
still `user`):

| Call | Result |
|---|---|
| `GET /users` | `403 FORBIDDEN` |
| Approve someone else's request | `403 FORBIDDEN` |
| Move a due date | `403 FORBIDDEN` |
| Mark a book returned | `403 FORBIDDEN` |
| `POST /books` | `403 FORBIDDEN` |
| `DELETE /books/:id` | `403 FORBIDDEN` |
| `GET /borrow-requests/overdue` | `403 FORBIDDEN` |
| Read someone else's request | `403` "You can only see your own requests." |
| `PATCH /users/<own id>` with `role: "librarian"` | `403` "You can't change your own role." |

**3. Edited the role inside the JWT** to `librarian` and sent it:
`401 "Invalid token."` The signature no longer matches, and only the
server has the secret.

So the frontend hid it, I could still make the frontend show it, and the
backend refused it every time. The role the server trusts comes from the
signed token and the database, never from anything the browser sends.

## Task 4: Pages you're not allowed on

I decided by who is asking, not just by the page:

- **Logged out:** redirect to the login page, then back to the page they
  wanted. They might be allowed once they log in.
- **Member on a staff page** (`/users`, `/books/add`, `/admins`): pretend it
  doesn't exist and show the normal "Page not found". A member has no
  staff pages at all, so a refusal would only tell them where the admin
  screens are and give them nothing they can act on.
- **Staff on a page above their role** (a librarian or admin opening
  `/admins`): a clear refusal, "This page is only for super admin accounts.
  If you need something changed here, ask one of them." Staff already know
  the page exists, so a 404 would look like a bug and they'd report it.

For the second case to exist I added a super admin screen, `/admins`
("Manage admins"), for matrix rows 21 and 22. Managing admins moved there,
and `/users` now only manages members and librarians. All of this is in
`RequireAuth`, and the API still answers `403` underneath whatever the page
shows.

## Task 5: Only your own request

In the interface, Cancel only shows on a request whose `userId` is the
logged-in user and that is still waiting (pending, queued or held). A
member only gets their own requests from the API anyway. Staff see everyone's
in the approval queue, but on someone else's card they get Approve and
Reject, never Cancel.

Then I tried it against the API. Sara asked for Dune, and three other
people sent `POST /borrow-requests/:id/cancel` for her request with their
own valid tokens:

- Usman (member): `403 FORBIDDEN`
- a librarian: `403 FORBIDDEN`
- the super admin: `403 FORBIDDEN`

Her request stayed `pending`, and only her own Cancel button changed it to
`cancelled`. The service compares the request's owner with the id from the
token, not with anything in the request body, so there's nothing to fake.
No bug this time. Week 7's self-approve bug was the same kind of mistake
(role checked, owner not checked), so I was half expecting one.

# Exercise 5 — The screen that updates itself

## Task 1: One socket for the whole app

There is one Socket.IO client, created once in `src/api/socket.js` with
`autoConnect: false`. It sends the access token in `auth`, and it reads
the token again on every reconnect, so the Week 7 middleware accepts it.

Opening and closing the connection is now React's job. `SocketProvider`
wraps the whole app in `main.jsx`. It connects when a user is logged in,
disconnects on logout, and reconnects when a different user logs in.
Components get the socket and its status through `useSocket()`, and the
Header shows "Live: connected" from it. Before this, the Redux auth slice
connected the socket as a side effect of login.

I used Context here, not Redux, because a socket isn't data that can live
in the store. That fits my Week 4 rule.

Checked in the Network tab: after login there is one
connection, and it is still the same one after moving through five pages.
A reload closes it and opens one new one, and logout closes it. The server
log never showed more than "1 sockets" for that user.

## Task 2: Joining a book's room

`BookDetail` has an effect on `[socket, id]`. It emits `client:book:watch`
for the book, adds a handler for `server:book:availability-changed` that
updates the copies on screen, and adds a `connect` handler that joins
again after a reconnect (the server forgets rooms when a socket drops).
The cleanup removes both handlers and emits `client:book:unwatch`.

I went back and forth between two books five times and counted the
handlers on the socket after each round:

| | With cleanup | Without cleanup |
|---|---|---|
| After round 1 | 1 | 3 |
| After round 5 | 1 | 11 |
| Back on `/books` | 0 | 11 |
| Server watch / unwatch | 11 / 11 | 11 / 0 |

Without the cleanup every visit left a handler and a room behind, and
StrictMode's double mount added an extra one on the first visit. With it,
there's only ever one, for the page that's open.

It's the same discipline as Week 3 Day 2, where the cleanup made a stale
request's response get ignored. `useDebounce` uses it to clear a timer,
and here it leaves a socket room.

## Task 3: The live counter

The handler from Task 2 already does it. When
`server:book:availability-changed` arrives for the open book, it sets
`onShelf` on the book in state and the Copies line re-renders. With the
backend already emitting, that's about ten lines.

Demo with two separate browsers, Sara and Usman, both members, both on the
Dune page showing 3 / 5. A librarian approved Sara's request, and both
screens changed to 2 / 5 without a refresh. When the book was marked
returned they both went back to 3 / 5.

## Task 4: When the socket drops

I stopped the API with Sara on the Dune page (3 / 5). Within a couple of
seconds the header said "Live: reconnecting" and the page showed "Live
updates paused, reconnecting... The copies shown may be out of date." The
copies stayed at 3 / 5, and the client tried again 4 times in about 10
seconds. While it was down I changed Dune to 1 on the shelf in the
database. When the API came back the socket reconnected by itself and the
page showed 1 / 5 without a refresh.

I went with refetch, not trusting the stream. The server doesn't keep
events for clients that were away, so anything emitted during the gap is
gone, and the only way to be right again is to ask. On every `connect` the
book page joins its room again and loads the book once more. That's one
request, and after that the stream takes over.

During the gap the user sees the last numbers they had, a "reconnecting"
label in the header and a warning that the copies may be out of date. Old
data stays on the screen, but it doesn't pretend to be live.

The socket also drops when the access token expires, since the server
disconnects it. `SocketProvider` now handles that: on a server disconnect
or an `UNAUTHORIZED` connect error it calls `/auth/refresh` and connects
again with the new token. With `JWT_EXPIRES_IN=15s` the socket was dropped
and reconnected twice in 30 seconds, and the page never left "connected".
It only logs the user out if the refresh itself is refused.

## Task 5: Connection indicator

The header now has a `LiveStatus` badge for anyone who is logged in. It
reads the status from `SocketProvider`:

- **Live** (green): connected, changes show up straight away.
- **Reconnecting...** (amber, blinking dot): the connection dropped and the
  client is trying again. It also shows "Connecting..." for the moment
  after login, so the page doesn't flash "offline" while it's still
  connecting.
- **Offline** (red): the browser has no network, so it doesn't pretend to
  be retrying.

To keep it honest I had to fix two cases where the status lied. If the
token refresh failed because of a network error, the status said
"reconnecting" but nothing was retrying. Now it tries again every 5
seconds. And when the browser goes offline it says "Offline" instead of
"Reconnecting...". The book page shows its "may be out of date" warning in
both of those states.

I checked it by stopping the API (Reconnecting), switching the browser to
offline (Offline), going back online with the API still down
(Reconnecting), and starting the API again (Live). A logged-out visitor
sees no badge, because nothing on their screen claims to be live.

## Task 6: The rest of the events

Each event now has a place in the interface:

- **Request approved or rejected** (`status-changed`): the member gets a
  notice ("Your request for "Hyperion" was approved...") and their list
  updates. It now goes to the staff counter as well, so a second
  librarian's queue doesn't keep showing a request someone else already
  approved.
- **Queue position** (`position-changed`): queued cards show "Place in
  queue: N". It's loaded once from `/borrow-requests/:id/queue` and then
  updated by the event.
- **Promoted to the front** (`promoted`): the member gets "A copy is held
  for you until 16 Nov 2026" and the card turns to held. The counter's list
  reloads.
- **New request** (`created`): staff get a notice and the approval queue
  reloads.

Notices are toasts (`react-hot-toast`) raised from `LiveNotices` in the
layout, so they show on any page. The
lists listen through a small `useSocketEvent` hook that removes its
listener on unmount, the same cleanup as Task 2.

Who gets what is decided by the server's rooms. `status-changed` and
`promoted` reach both the owner and the counter, so I added `userId` to
both payloads, and the frontend only shows a notice when it's yours. I ran
one book with 1 copy through three browsers: Usman borrows, Sara and Test
User queue, Sara leaves, Usman returns, Test User gets the hold and is
approved. Usman's socket only received his own two status events. Test
User got their queue position (2, then 1), the hold and the approval. The
librarian got the new requests and status changes but no queue positions.
Every screen updated without a refresh.

# Exercise 6 — Two sources of truth

## Task 1: Reproducing it

The catalogue lives in the Redux store (`state.books.items`) and is only
filled by `GET /books`. The socket's `availability-changed` handler only
updates the book page's own local state, so the store never hears about
it.

Sara loaded the catalogue (Hyperion 2 / 4), then opened Hyperion. From
another browser Usman's request was approved:

| | Book page | Store | Database |
|---|---|---|---|
| After the checkout | 1 / 4 | 2 / 4 | 1 / 4 |

Then she went back to the catalogue on a slow connection. For 2.5 seconds
the card said **2 / 4** under "Updating books...", with the header badge
still green "Live". When the refetch came back it changed to 1 / 4.

The worse version: the copy was returned (book page 2 / 4), and she went
back to the catalogue while offline. The page showed "We couldn't connect
to the server" above the full list, and Hyperion still said **1 / 4**. That
was wrong, and it stayed wrong until the next successful fetch.

The book page was right both times, because it matched the database. The
catalogue was showing the store, and the store only knows what the last
HTTP fetch said.

## Task 2: One place for the truth

Socket events now land in the store, and nowhere else. `store.js`
registers the `availability-changed` handler once, next to the store, and
it dispatches `availabilityChanged`. Components don't listen for data
events any more.

To make "one place" true, the books slice keeps each book once in `byId`.
The catalogue keeps only the `ids` of its current page and reads the books
from `byId` (through a memoised selector). The book page puts what it
fetched into `byId` with `bookLoaded` and reads `byId[id]`. Both screens
read the same object, so an event changes both at once. The book page
still joins and leaves the room. That's its only socket job now.

Same run as Task 1:

| | Book page | Store | Catalogue card |
|---|---|---|---|
| After the checkout | 1 / 4 | 1 / 4 | 1 / 4 straight away, even before the refetch |
| Copy returned, catalogue opened offline | 2 / 4 | 2 / 4 | 2 / 4, under the error |

Why the Task 1 version breaks: a handler that writes component state only
fixes the one component that happens to be mounted, and every other copy
of that number keeps whatever its last fetch said.

## Task 3: Ordering

I made it happen on purpose by holding the book page's `GET /books/:id`
response in the browser after the server had answered (1 on the shelf).
While it was held, Usman's checkout went through and the socket event set
the store to 0. When the held response was let go it wrote 1 back over
the 0.

What the user sees: the right number for a moment, then a wrong one that
looks perfectly normal and stays wrong, because no new event is coming to
correct it.

How I stopped it: the store remembers when the last event for each book
arrived (`eventAtById`). Each HTTP response carries the time its request
was sent: the fetch thunk records it in `getPendingMeta`, and the book page
passes it to `bookLoaded`. If an event arrived after the request was sent,
the response is older than the event, so it keeps the event's `onShelf`
and only takes the other fields. Same test after the fix: the response
landed and the page stayed at 0 / 4.

The fuller fix would be on the server: a version number on each book that
goes up on every change and is sent in both responses and events, so the
client keeps whichever is higher. That needs a migration, and the time
check covers the case we actually hit.

It's most like the Week 3 one. That was also a late response landing on
top of newer data on the client, and the fix was the same idea: work out
which answer is older and ignore it. The Week 6 double promotion was two
writes racing on the server, and the fix there belonged in the database.

## Task 4: Optimistic updates against the real API

In Week 4 only borrowing was optimistic: the button switches to
"Requesting..." straight away and rolls back with the API's message if the
request fails. Deleting a book already waited for the server, and the
filter chips only change the view, so there's nothing to roll back.

Checked against the real API, borrowing had three problems the mock
couldn't show:

- **No copies left** doesn't fail. The API puts the request in the queue,
  but the button still said "Request sent". It now uses the status the
  server sends back and says "You're in the queue".
- **The request ends later** (cancelled, rejected, expired, returned): the
  button stayed on "Request sent" forever, so the member couldn't ask
  again. The store now hears `status-changed` for the member's own request
  and clears it.
- **Another user logs in** in the same browser and saw the previous user's
  "Request sent". Borrow state is now cleared on login, logout and session
  end.

Making the server refuse:

1. Sara at 5 open requests asked for a sixth. The button went
   "Requesting..." then back to "Borrow", with "Members can have at most 5
   open borrow requests." shown under it.
2. A book with no copies went "Requesting..." then "You're in the queue".
   When she left the queue from another tab, it changed back to "Join the
   queue" without a refresh.
3. An admin deactivated Test User while they were on a book page. The
   server dropped their socket, the refresh was refused, and they were on
   the login page within a second. With the account switched off directly
   in the database (no event), clicking Borrow went "Requesting...", got
   `401`, and ended on the login page. Nothing stayed on "Request sent", and
   no request was created.

## Task 5: Three ways data gets in

**HTTP responses.** Good for the full picture: first load, a page of the
catalogue, catching up after a reconnect. Every field is there and it
comes from the database. Bad at staying true. It's a snapshot of the
moment the server read it, it's already old when it lands, and it only
gets updated if I ask again.

**Socket events.** Good for small changes that just happened ("Hyperion is
now 1 on the shelf") without anyone asking, and that's what makes the
screen live. Bad at being complete or guaranteed. An event only carries the
field that changed, only reaches rooms I've joined, and anything sent while
I was disconnected is lost for good.

**Optimistic updates.** Good for feel: the button reacts the moment it's
clicked. Bad at being true, because it's only a guess about what the server
will say. It has to be rolled back when the server refuses, and the server
can answer something I didn't guess (queued instead of pending).

**The rule:** the server wins over my guess, and between two things the
server said, the later one wins. An optimistic value only lasts until the
server answers. A socket event beats any response to a request sent before
the event arrived, and a fresh fetch beats events I may have missed (which
is why I refetch on reconnect). All three write into the same place in the
store, so that rule only has to be applied once.

# Exercise 7 — The same page, rendered somewhere else

## Task 1: A fresh Next.js app

Scaffolded in its own folder, `nextjs-project/`, with
`npx create-next-app@latest`.

- **Version:** Next.js 16.4.6
- **Router:** the App Router (`app/` folder with `layout.tsx` and
  `page.tsx`), not the older Pages Router (`pages/`)

The default page runs with `next dev` and loads at `localhost:3300`.

## Task 2: Porting the book list and book detail

Both pages read from library-api (`NEXT_PUBLIC_API_URL` in `.env.local`).
`BookCard`, `FilterChips`, `SearchBox`, `ResultCount`, `Pagination` and
`useDebounce` were copied as they are.

What I had to change:

- **Data fetching:** the `useEffect` + Redux thunk became an `async` page
  that awaits `fetch` on the server (`app/books/page.jsx`,
  `app/books/[id]/page.jsx`).
- **Routing:** React Router became folders. `/books/:id` is now
  `app/books/[id]/`. `useParams` became the `params` prop (a Promise), and
  `useNavigate` became `useRouter` from `next/navigation`.
- **Loading and errors:** the `status === "loading"` / `"failed"` checks
  became `loading.jsx` and `error.jsx` files. The 404 case calls
  `notFound()` and shows `not-found.jsx`.
- **Filter, search and page:** these moved from the Redux store into the URL
  (`?status=out&q=dune&page=2`), because the server reads them from there.
- **Client parts:** anything with `onClick` or state needs `"use client"`.
  The server page can't pass functions like `onSelect` down, so the list
  UI (`components/Books.jsx`) is a client component and the page only
  fetches.
- **Env:** `import.meta.env.VITE_API_URL` became
  `process.env.NEXT_PUBLIC_API_URL` (the only change in `BookCard`).
- **Left out:** borrow, edit, delete, the live copy count and the gap
  banner. They need login, the Redux store and the socket, which this app
  doesn't have.

## Task 3: Routing

The book detail route is `app/books/[id]/page.jsx` from Task 2.

| | React Router (library-web) | Next.js (nextjs-project) |
| --- | --- | --- |
| Where the route lives | `App.jsx`: `<Route path=":id" element={<BookDetail />} />` inside `<Route path="/books">` | the folder `app/books/[id]/` with a `page.jsx` in it |
| The `:id` part | `:id` in the path string | the `[id]` folder name |
| Reading it | `const { id } = useParams();` | `const { id } = await params;` |
| Loading / error / 404 | `if` checks inside the component | `loading.jsx`, `error.jsx`, `not-found.jsx` next to the page |
| Guards and layouts | wrapper routes like `<RequireAuth>` and `<AppLayout>` | `layout.jsx` in a folder (auth would go in the layout or proxy) |

**With forty routes** I'd find Next easier. The folder tree is the route
list, so I find a page by its URL without reading a long `App.jsx`, and
each route keeps its loading and error files right next to it.

**With four routes** React Router is easier. The whole app fits in one
small block of JSX in one file, and I can see every route, guard and
layout at once. In Next the same four routes are spread over several
folders and files that I'd have to open one by one.

## Task 4: The server/client boundary

I added a "More details" button to the book detail page using my
`useToggle` hook, straight inside `app/books/[id]/page.jsx`. The page
returned 500 and the terminal showed:

```
You're importing a module that depends on `useState` into a React Server
Component module. This API is only available in Client Components. To fix,
mark the file (or its parent) with the "use client" directive.

Import trace:
  Server Component:
    ./hooks/useToggle.js
    ./app/books/[id]/page.jsx
```

**What decides it:** in the App Router every component is a server
component unless its file starts with `"use client"` or it's imported by a
file that does. Server components run once on the server and send HTML, so
there is no state, no effects and no `onClick`.

**Fix:** I moved the details list and the button into
`components/BookDetails.jsx` with `"use client"` at the top. The page stays
a server component, fetches the book and passes it down as a prop. The
button's HTML still comes from the server, and the click works once the
page loads in the browser.

**My Week 3 hooks:**

| Hook | Server component | Client component |
| --- | --- | --- |
| `useToggle` | no (`useState`) | yes |
| `useForm` | no (`useState`) | yes |
| `useDebounce` | no (`useState`, `useEffect`) | yes |
| `useBookSearch` | no (`useState`, `useEffect`) | yes |
| `useBranch` | no (`useContext`) | yes, under the provider |

None of them work on the server side. In practice the server part fetches
and renders the data, and anything the user clicks or types into goes in a
small `"use client"` component under it.

## Task 5: An API route in the frontend

I added `app/api/health/route.js`. `GET /api/health` returns
`{ "web": "up", "api": "up" }`, or `"api": "down"` when library-api doesn't
answer. Any other method gets a 405 from Next.

**When a frontend endpoint is the right place:** when the thing belongs to
the frontend and not to the library:

- checking the web app itself, like this health route
- hiding a secret key the browser shouldn't see (a third-party API key)
- setting cookies on the frontend's own domain, which would also get
  around the cross-site cookie problem we have with the refresh token
- small glue for one page, like reshaping data from library-api

**Why not move the whole backend into it:**

- **Sockets and cron:** route handlers answer one request and stop.
  Socket.IO and the node-cron jobs need a server that stays running.
- **More than one client:** library-api is also used by library-web,
  Postman and the tests. It shouldn't depend on one frontend project.
- **Deploys:** every frontend change would redeploy the backend too, and a
  backend bug would take the website down with it.
- **Rewrite:** the Express middleware (auth, roles, rate limit, error
  handler) doesn't plug into route handlers and would have to be redone.

# Exercise 8 — What server rendering actually buys

## Task 1: What is actually sent

View source of `/books/<id>` for Dune on both apps.

**Vite (library-web), 631 bytes, the whole file:**

```html
<!doctype html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>library-web</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Next (nextjs-project), 17 KB, script tags and the RSC payload cut out:**

```html
<!DOCTYPE html>
<html lang="en" class="... h-full antialiased">
<head>
<meta charSet="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<link rel="stylesheet" href="/_next/static/chunks/23yho4fkooopa.css" data-precedence="next"/>
<script src="/_next/static/chunks/1844mozgd1e4a.js" async=""></script>
... 8 more script tags ...
<title>Karachi Central Library</title>
<meta name="description" content="Generated by create next app"/>
</head>
<body class="min-h-full flex flex-col">
<template id="B:0"></template>
<main><p role="status">Loading book...</p></main>
...
<div hidden id="S:1">
<main>
<section class="detailPanel">
<h1>Dune</h1>
<dl class="detailList">
<div><dt>Author</dt><dd>Frank Herbert</dd></div>
<div><dt>Year</dt><dd>1965</dd></div>
<div><dt>Copies</dt><dd>3<!-- --> / <!-- -->5</dd></div>
</dl>
<div class="detailActions"><button type="button">More details</button></div>
</section>
</main>
</div>
<script>$RS=function(a,b){...}</script>
<script>self.__next_f.push([1,"..."])</script>
</body>
</html>
```

The Vite page has no book in it at all, just an empty `<div id="root">`;
the title only appears after `main.jsx` runs and calls the API. The Next
page has the title, author, year and copies in the HTML. It first sends the
`loading.jsx` fallback, then the real page further down the same response
in a hidden div, and a small script swaps it in.

## Task 2: What the browser does next, and who cares

**Vite:** the browser gets the empty shell and shows a blank page. It then
downloads the JS bundle, runs React, React calls `/books/:id` on the API,
and only when that answers does "Dune" appear. Three round trips before
there's anything to read.

**Next:** the browser gets the book in the HTML and paints it straight
away. The JS downloads after that and hydrates the page, which is when the
"More details" button starts working. The text is readable before any
JS has run.

**Who cares:**

| Visitor | Why the difference matters | Do they visit our catalogue? |
| --- | --- | --- |
| Search engine crawlers | They index what's in the HTML. Google does run JS but later and not always; other crawlers mostly don't. | A little. Someone might search "Dune Karachi library", but most pages (requests, members) are behind login anyway. |
| Link preview bots (WhatsApp, Slack) | They never run JS. On Vite a shared book link shows "library-web" with no book. | Yes, members sharing a book link with a friend is likely. I added `generateMetadata` so the Next page puts the book in `<title>` and the `og:` tags. |
| People on a slow phone or network | They see the book before the JS finishes loading. | Some, on mobile data. But most visits are members and staff who log in and come back often, so the JS is already cached and the page is fast either way. |

Honestly, for this app the main visitors are logged-in members and staff,
and for them server rendering changes very little.

## Task 3: Measuring it

Production builds of both, Dune's detail page, logged out. DevTools
"Slow 4G"-style throttling (150 ms latency, 1.6 Mbps down) plus 4x CPU
slowdown, cache disabled. Five loads each, median in ms:

| | FCP | Book visible | Interactive | Transferred |
| --- | --- | --- | --- | --- |
| Vite | 1460 | 1925 | 1925 | 197 KB |
| Next | 1284 | 1241 | 2071 | 237 KB |

- **Vite:** first paint is the "Loading..." text while the app checks the
  session with `/auth/refresh`. Only then does it ask for the book, so the
  book shows up about 450 ms after first paint. It's interactive the
  moment it shows, because React built it.
- **Next:** the first paint is already the book, about 700 ms sooner than
  Vite. But it only becomes interactive about 800 ms after that, once
  hydration finishes, and it ends up ~150 ms behind Vite because it ships
  more JS.

So server rendering wins on seeing the book and loses a little on being
able to use it.

**What it costs:**

- **A server that has to keep running.** Vite builds to 441 KB of static
  files (`index.html`, one JS, one CSS) that any file host serves for free.
  Next needs a Node process running all the time, about 110 MB of RAM on
  my machine even when idle.
- **Work on every page view.** The static host answered in ~2 ms; Next
  took ~42 ms per request (unthrottled) because it renders React and calls
  library-api for each visitor. More visitors means more server, and if
  that server is down the page is down too, not just the data.
- **Another thing to deploy and watch,** next to library-api.

## Task 4: Three ways to render

- **Static generation:** the HTML is built once at build time and served
  as a file to everyone, so it's fast and cheap but only as fresh as the
  last build.
- **Server rendering:** the HTML is built on the server for every request,
  so it's always fresh and can be different per visitor, but every visit
  costs server work.
- **Client rendering:** the server sends an empty shell and the browser
  fetches the data and builds the page, so it's per user and live but shows
  nothing until the JS has run.

| Page | Pick | Why |
| --- | --- | --- |
| Public catalogue | Static, rebuilt every few minutes | Same for every visitor and public, so crawlers and link previews should get real HTML. Titles and authors barely change, so a few minutes old is fine. The copy counts are the only part that goes stale, and those can be fetched in the browser after load. |
| Book detail | Server rendering | Also public and the page people share, so it needs the book in the HTML and in `<title>`. Unlike the list, the copy count is the main thing on the page and changes with every loan, so it should be right when the page loads. New books also show up without a rebuild. After that the socket keeps it live. |
| Member's own borrow list | Client rendering | Private and behind login, so there's nothing for a crawler or a preview, and it must never be built once and served to everyone. Our access token lives in the browser, not in a cookie the Next server could read, so the browser is where the data can be fetched anyway. |
| Librarian approval queue | Client rendering | Staff only, changes every few minutes, and the page is all buttons (approve, reject). A server-rendered first paint would be out of date as soon as the socket sends the next request, and only a handful of staff ever load it, on a fast library connection. |

## Task 5: Does the search engine argument apply?

Mostly no. Borrowing, requests, members, approvals and fines are all
behind a login, and a crawler can't log in, so server rendering does
nothing for search there. The only public pages are the catalogue and book
detail. Even those won't get much search traffic: people looking for a
book search Google and land on Amazon or Goodreads, not on one city
library's catalogue. Our users are members and staff who already know the
site and come straight to it. The small real gain is link previews when a
member shares a book, and that only needs the `<title>` and `og:` tags on
the detail page.

Where it would decide things: an **online bookshop**. Each book is a public
product page, most new customers arrive from a Google search like "buy
Dune paperback", and a page that Google can't read properly is a sale lost
to a competitor. There server rendering (or static pages) would be the
reason to pick the framework.

# Exercise 9 — Would you migrate?

## Task 1: What a migration would touch

| Area | What would change | Size |
| --- | --- | --- |
| Routing | The 11 paths in `App.jsx` become folders under `app/`. `RequireAuth` and `AppLayout` become layouts or client guard components, `NavLink`/`useNavigate` become `Link`, `usePathname` and `useRouter`. Mechanical, but every page is touched. | A day |
| Data fetching | The thunks, `usePagedList` and `api/*` all run in the browser with the bearer token. They keep working as they are inside `"use client"` components. Moving them to the server, which is the point of Next, runs into the auth problem below. | An hour as is, a rethink to use the server |
| Redux store | `store.js` creates one store when it's imported and wires the socket listeners there. On a Next server that module is shared by every visitor's request, so it has to become a `makeStore()` per request inside a client provider, with the socket wiring moved into an effect. | A day |
| Socket connection | `api/socket.js` and `SocketProvider` only make sense in the browser (they use `window` and a long-lived connection). They need `"use client"` and must never run on the server. | An hour |
| Auth token | The access token lives in browser memory (`session.js`) and the refresh cookie is `httpOnly`, `sameSite: strict` and set by library-api on its own domain. The Next server never sees either, so every server-rendered page renders as logged out. To server-render anything private the login flow has to move to cookies the Next server can read (same domain, or Next routes in front of `/auth`), and the role checks move from `RequireAuth` to the server. | A rethink |
| Styling (Week 4) | We kept CSS Modules plus the global `tokens.css`/`index.css`. Next supports CSS Modules as they are, and the global files just get imported once in the root layout. I did this for Exercise 7 in a few minutes. | An hour |

## Task 2: Gains and losses

**Gains:**

- A shared book link shows the book's title in WhatsApp instead of
  "library-web".
- On a slow phone the public catalogue and book pages show the book about
  0.7 s sooner.

**Losses:**

- **Hosting:** today the frontend is a folder of static files that any
  free file host can serve. With Next it needs a Node server running all
  the time (~110 MB RAM, work on every page view), which costs money and is
  one more thing that can go down.
- Pages become usable a little later (~0.15 s), since more JS has to load
  and hydrate.
- The auth rethink and rewrite time, for pages members and staff already
  use without complaint.

## Task 3: Recommendation

To the committee,

My recommendation is not to rebuild the library frontend in Next.js.

I spent a day porting two of our pages to it. Rebuilding the whole app
would take about 8 working days for one developer: a day for routing, a
day for the Redux store, 3 to 4 days to redo login so the server can see
who is logged in, and 2 days to test every page again.

What we would get for that is small. A shared book link would show the
book's title, and the public book pages would appear about 0.7 seconds
sooner on a slow phone. Most of the library is behind a login, where
server rendering doesn't help members or staff at all.

What we would lose is cheap hosting. Today the frontend is a set of static
files that can be hosted for free. Next needs a server running all the
time, which costs money and is one more thing to keep up.

The current app works and nobody has complained about its speed. If
shared links become important later, we can fix that one page without
rebuilding everything.

## Task 4: What I'd take back to Vite

1. **What you're looking at belongs in the URL.** When I ported the
   catalogue, the filter, search and page had to move out of Redux into
   `?status=out&q=dune&page=2`. That turned out better on its own: refresh
   keeps your place, the back button works, and a filtered list can be
   shared as a link. I'd do the same in library-web with `useSearchParams`.

2. **Keep state at the leaves.** The server/client split made me write the
   page as "fetch and show" and put the state in one small component (the
   "More details" toggle). In a Vite app nothing forces that, but the same
   shape keeps pages simple and means a click only re-renders the small
   part that changed.

# Exercise 10 — The framework that does Week 7 for you

## Task 1: Reading the scaffold

Scaffolded with `npx @nestjs/cli new nestjs-project` (Nest 12). It runs on
`PORT=3000 npm run start` and `GET /` returns "Hello World!".

| Nest file | What it does | Our Week 7 equivalent |
| --- | --- | --- |
| `app.module.ts` | Lists the controllers and services and lets Nest create and connect them | `services/createServices.ts` plus the wiring in `server.ts` (`createServices(createRepositories(prisma), events)`), where we connect everything by hand |
| `app.controller.ts` | Class with `@Controller()` and `@Get()`; handles the request and calls the service | `controllers/books.controller.ts` plus `routes/books.routes.ts`, since Nest puts the path on the controller method instead of in a separate router file |
| `app.service.ts` | `@Injectable()` class with the logic | `services/books.service.ts` (`createBooksService(booksRepository, events)`) |

## Task 2: A books resource

Generated with `nest g resource books`, then filled in under
`nestjs-project/src/books/`:

- `dto/create-book.dto.ts`: `CreateBookDto` with class-validator rules,
  the same ones as our zod `createBookSchema` (title 1 to 200 chars,
  13-digit ISBN, whole numbers for year, copies and fine).
- `dto/update-book.dto.ts`: `PartialType(CreateBookDto)`, so every field
  is optional, like `createBookSchema.partial()`.
- `books.service.ts`: CRUD on an in-memory array. Missing id throws
  `NotFoundException` (404), duplicate ISBN throws `ConflictException`
  (409).
- `books.controller.ts`: `POST /books`, `GET /books`, `GET /books/:id`,
  `PATCH /books/:id`, `DELETE /books/:id` (204). `ParseUUIDPipe` rejects a
  bad id with 400.
- `main.ts`: a global `ValidationPipe` with `whitelist` and
  `forbidNonWhitelisted`. Without it the DTO decorators do nothing.

A bad body gets a 400 listing every problem, and an unknown field like
`price` is rejected.

## Task 3: Where the injection happens

**Who creates the service:** Nest does, inside `NestFactory.create(AppModule)`.
It reads each module's `providers`, sees what each class's constructor
asks for, creates them in the right order and passes them in. TypeScript
makes that possible: with `emitDecoratorMetadata` the build leaves the
constructor's types on the class, and `dist/books/books.controller.js`
has `__metadata("design:paramtypes", [BooksService])`. That list is what
Nest reads.

**What `@Injectable()` is for:** it's what makes TypeScript write that
metadata for the service's own constructor. I gave `BooksService` a
`Clock` dependency and removed the decorator: the app still started, but
`clock` was `undefined`, with no error. With the decorator, it got a real
`Clock`. (With no constructor arguments it makes no difference, which is
why removing it from the plain `BooksService` changed nothing.)

**What `providers` does:** it's the list of things Nest is allowed to
create in that module. When I removed `BooksService` from it, the app
refused to start: "Nest can't resolve dependencies of the BooksController
(?). Please make sure that the argument BooksService at index [0] is
available in the BooksModule module." Each provider is created once and
shared: the controller and `app.get(BooksService)` got the same object,
and the constructor ran once.

**Compared to Week 7:** we already had the idea. Our services get their
repositories as arguments, and `server.ts` builds everything with
`createServices(createRepositories(prisma), domainEvents)`. What Nest adds
on top is the bookkeeping that grows with the number of services:

- **Order.** In `createServices.ts` I have to build `books` and `users`
  before `borrowRequests`, and `borrowRequests` before `reminders`. Nest
  works the order out itself.
- **Sharing.** I pass the same `books` variable into `borrowRequests` by
  hand so there's one instance. Nest makes every provider a single shared
  instance.
- **Changing a dependency.** `createBorrowRequestsService` takes six
  positional arguments and is called by hand in three places
  (`createServices.ts` and both test files). Adding a seventh means
  editing all three in the right position. In Nest I'd only change the
  constructor.
- **Mistakes found at startup.** A missing dependency stops the app with
  a message naming the class and the argument, instead of an `undefined`
  that fails later.

With our seven services `createServices.ts` is 79 lines and still easy to
follow. With fifty it's a long file that has to be kept in order by hand,
and that's the part Nest takes over.

## Task 4: class-validator against zod

The same rules both ways (the zod one is our `createBookSchema`, trimmed
to the shared fields):

```ts
// Nest: src/books/dto/create-book.dto.ts
export class CreateBookDto {
  @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @IsOptional() @IsString() author?: string;
  @IsInt() @Min(0) year: number;
  @Matches(/^\d{13}$/, { message: 'isbn must be 13 digits' }) isbn: string;
  @IsInt() @IsPositive() totalCopies: number;
  @IsInt() @Min(0) finePerDay: number;
}
```

```ts
// library-api: src/schemas/books.schema.ts
const createBookSchema = z.object({
  title: z.string().min(1).max(200),
  author: z.string().optional(),
  year: z.number().int().nonnegative(),
  isbn: z.string().regex(/^\d{13}$/, "ISBN must be 13 digits."),
  totalCopies: z.number().int().positive(),
  finePerDay: z.number().int().nonnegative(),
});
```

| | class-validator | zod |
| --- | --- | --- |
| Where the rules live | Decorators on each property of a DTO class | A schema object |
| Type produced | The class is the type, but the decorator and the type are written separately. `@IsString() year: number` compiles with no error. | `z.infer<typeof schema>` comes from the rules, so they can't disagree (`z.string()` then `year: 1965` is a compile error) |
| Error | `{ message: [...strings], error, statusCode }`. The field name is only inside the sentence, and `year: "1965"` gave two messages, one of them "must not be less than 0". `price` was rejected (`forbidNonWhitelisted`). | Ours is `{ error, message, details: [{ field, message }] }`, a field per message, built by our `validate` middleware. One clear message for year ("expected number, received string"). `price` was silently dropped. |
| How it's wired | One global `ValidationPipe` in `main.ts`; each route just types its body as `@Body() dto: CreateBookDto` | `validate(createBookSchema, "body")` added by hand to each route in `books.routes.ts` |

**Which I prefer:** zod. The type comes from the rules so they can't
drift apart, the same schema can be used in the React forms, and I can
see on the route exactly what's checked. In a Nest project I'd still use
class-validator, because the global pipe and DTO classes are how Nest is
built and fighting that isn't worth it.

## Task 5: Opinionated against hand-made

**Better with Nest:**

- **Everyone's code looks the same.** A new developer opens `books/` and
  finds a module, controller, service and DTO in the place they expect.
  Ours took three weeks of decisions (layers, `createServices`,
  `servicesFor(req)`, where validation goes) that someone new has to learn
  from our code.
- **The wiring scales without effort.** Adding a service or a dependency
  is a constructor change, and a missing one fails at startup (Task 3).
  Ours is a hand-kept `createServices.ts` that grows with every service.

**Worse with Nest:**

- **Unusual things get harder.** Our transaction trick rebuilds all the
  services with the transaction's repositories and an emitter that holds
  events back. That's a few lines with plain functions; in Nest, with one
  shared instance of each service, it needs a different design.
- **More hidden behaviour to learn.** Decorators, metadata, pipes and
  modules do a lot out of sight, and a mistake can fail silently, like
  the missing `@Injectable()` that left `clock` as `undefined`.

**For five people over two years:** Nest. With five people the biggest
risk is everyone wiring things their own way, and over two years the
service count only grows. The rules Nest forces are close to what we
chose by hand anyway, so we'd lose little and every new teammate could
find their way around on day one.

# Exercise 11 — Guards, pipes and interceptors

## Task 1: Our middleware in Nest's terms

Nest runs them in this order: middleware → guards → interceptors (before)
→ pipes → handler → interceptors (after), with exception filters catching
anything thrown.

| Our file (`src/middleware/`) | Nest concept | Why |
| --- | --- | --- |
| `requestId.ts` | Middleware | Runs on every request before routing and doesn't care which handler it reaches |
| `requestLog.ts` | Middleware (ambiguous) | See below |
| `requireAuth.ts` | Guard | Answers "may this request go on?" and sets `req.user` for later |
| `requireRole.ts` | Guard | A yes/no on the role, the textbook guard (with a `@Roles()` decorator instead of `requireRole(...STAFF_ROLES)`) |
| `validate.ts` | Pipe | Checks `body`/`query`/`params` and replaces them with the parsed data, which is exactly validate-and-transform |
| `apiRateLimiter.ts`, `bookSearchRateLimiter.ts` | Guard | Allow or refuse before the handler runs (Nest's own `ThrottlerGuard` is one) |
| `loginRateLimiter.ts` | Guard + interceptor (ambiguous) | See below |
| `errorHandler.ts` | None of the four, an exception filter | See below |

**Ambiguous ones:**

- **`requestLog.ts`:** it logs status and duration when the response
  finishes, which sounds like an interceptor (it wraps the handler). But
  an interceptor runs after the guards, so it would never see a request
  refused by `requireAuth`, a rate limit or a 404, and those are exactly
  the ones I want in the log. Middleware sees everything, so I'd keep it
  as middleware.
- **`loginRateLimiter.ts`:** the first half is a guard (refuse when there
  are too many failed attempts). The second half waits for the response
  and only counts the attempt if the status was 401, which is
  interceptor work. In Nest it would split into two.
- **`errorHandler.ts`:** turning errors into `{ error, message, details }`
  with the right status isn't any of the four. Nest has a fifth thing for
  it, the exception filter. An interceptor's `catchError` is the closest
  of the four, but it wouldn't catch errors thrown by guards or
  middleware.

## Task 2: A roles guard

In `nestjs-project/src/auth/`:

- `roles.decorator.ts`: `Roles = Reflector.createDecorator<Role[]>()`, so a
  route says `@Roles(STAFF_ROLES)`.
- `roles.guard.ts`: `RolesGuard` reads the roles for the handler (or its
  class) with `reflector.getAllAndOverride`. No roles means open, no user
  is 401, wrong role is 403, same messages as our `requireRole`.
- `app.module.ts`: the guard is registered once for the whole app with
  `APP_GUARD`. A small `DemoUserMiddleware` sets `req.user` from an
  `X-Role` header, standing in for `requireAuth` since this app has no
  login.

The books routes use the same roles as ours: `POST` and `PATCH` are staff,
`DELETE` is admin. No header gets 401, `user` gets 403, a librarian can
create and update but gets 403 on delete, an admin can delete (204), and
`GET` is open to anyone.

**Comparison:** `requireRole(...STAFF_ROLES)` is a function that returns
middleware, put into the route's middleware list, and the roles are
locked inside that closure. `@Roles(STAFF_ROLES)` only stores the roles
on the method, and one guard reads them on each request. That makes
these easier:

- **One check, registered once.** Routes only declare what they need, and
  a route with no `@Roles` is open. I can't forget to put the role check
  after `requireAuth` in the right order on one route.
- **Defaults on the class.** `@Roles(STAFF_ROLES)` on the controller
  covers every route, and a method can override it.
- **The rules can be read without running a request.** A short script
  reading the metadata listed every route and its roles (`create`:
  librarian, admin, super admin; `findAll`: anyone; `remove`: admin,
  super admin). With our closures, the only way to find out is to read
  every routes file or send requests.

## Task 3: Pipes, and route parameters as strings

In `nestjs-project/src/common/pipes/`:

- `dto-validation.pipe.ts`: `DtoValidationPipe` turns the body into the
  DTO class with `plainToInstance`, runs class-validator on it (unknown
  fields rejected) and throws a 400 in the same
  `{ error, message, details }` shape as our API. It replaces Nest's
  built-in `ValidationPipe` as the global pipe in `main.ts`. For plain
  types like `string` or `number` it passes the value through.
- `parse-positive-int.pipe.ts`: `ParsePositiveIntPipe` turns a route
  parameter into a number, and gives a 400 for anything that isn't a
  positive whole number (`abc`, `0`, `19.5`). It's used on the new
  `GET /books/year/:year`.

**The strings problem:** everything in a URL is a string. In Week 4 and
Week 5 that broke comparisons, because `"1965" === 1965` is false. I
removed the pipe from `/books/year/:year` to check. The handler is
written as `year: number`, but it got `"1965"` (a string) and returned
`[]` with a 200, with no error anywhere. The `number` type is only for
TypeScript and nothing checks it at runtime.

**Nest vs our zod coercion:**

- In our API the conversion is in the schema: `z.coerce.number()` in
  `schemas/common.ts`, run by the `validate` middleware. After that,
  `req.query.page` really is a number, and the type comes from the
  schema, so they can't disagree.
- In Nest the conversion is a pipe on the parameter itself:
  `@Param('year', ParsePositiveIntPipe)`. The `number` in the signature
  is just written by hand. If the pipe is missing, TypeScript still
  says `number` and the value is still a string. Zod would at least
  make the type `string` without the coercion. (The built-in
  `ValidationPipe` with `transform: true` can also convert using the
  declared type, but it's off by default.)

## Task 4: Timing and envelope interceptors

In `nestjs-project/src/common/interceptors/`, both registered for the
whole app with `APP_INTERCEPTOR`:

- `timing.interceptor.ts`: notes the time before the handler, and after it
  logs `POST /books 201 4.7ms`. Errors are logged with their status too
  (`GET /books/<id> 404 0.6ms`). A request refused by the guard (401)
  never shows up, because guards run before interceptors.
- `envelope.interceptor.ts`: wraps whatever the handler returns in
  `{ data }`, so a book is `{ "data": { ... } }` and the list is
  `{ "data": [ ... ] }`. A `204` with nothing returned stays empty, and
  errors don't pass through it.

**Is an envelope better?** For: one fixed shape means the client always
reads `body.data`, and there is room next to it for `meta` (paging)
without breaking anyone, which is how our list endpoints ended up as
`{ data, meta }` in Exercise 3. Against: raw objects are simpler to read
and test, the status code already says success or failure, and adding
an envelope later is a breaking change for every client (the Nest e2e
test for `GET /` failed the moment I added it). I'd go with the
envelope, because paging needs `meta` anyway and one shape everywhere is
easier than remembering which endpoints are wrapped. Our Express API
already does this by hand since Exercise 3, so the Week 1 specification
is the part that's out of date, and in Nest one interceptor does it for
every route.

## Task 5: Twelve endpoints or two hundred

**Twelve endpoints: Express.** The whole API fits in a few route files
and one person can hold it in their head. Hand-wiring the services is a
handful of lines, and putting `requireAuth, requireRole(...), validate(...)`
on each route is easy to check by reading. Nest's modules, decorators,
DI and rxjs would be more to learn than the app itself.

**Two hundred endpoints: Nest.** Our Express API has about 25 endpoints
and `createServices.ts` is already 79 lines with the same positional
arguments in three places. At 200 that file, and the middleware lists on
every route, become the part that breaks.

**What changes the answer:** Nest's cost is mostly fixed: you learn
modules, DI, guards, pipes and interceptors once, and it's the same at 12
endpoints or 200. Express's cost grows with every route, because every
route repeats its own auth, role and validation middleware in the right
order, and every new service has to be wired by hand. In Nest those are
declared once (`APP_GUARD`, a global pipe, `APP_INTERCEPTOR`, `providers`)
and each route only says what it needs, like `@Roles(STAFF_ROLES)`. More
endpoints also means more people, and with Nest every module has the
same shape, so someone new knows where things go without our own
conventions being explained. So the turning point isn't an exact number.
It's when the repeated per-route wiring and the number of people working
on it cost more than learning Nest once.

# Exercise 12 — Express or Nest

## Task 1: The comparison

| | Express (our `library-api`) | Nest (our `nestjs-project`) |
| --- | --- | --- |
| **Setup cost** | `npm i express` and one file, running in minutes. But the structure (layers, `createServices`, error handler, validation, tests) took us weeks to decide and build. | `nest new` gives modules, a test setup, lint and a build in a minute, and `nest g resource` makes a full CRUD skeleton. More packages and config to start with (decorator flags, class-validator, rxjs). |
| **Structure** | Whatever we decide. Ours is routes → controllers → services → repositories, held together by convention and code review. | Fixed: module, controller, service, DTO for each feature, wired by DI. Guards, pipes, interceptors and filters each have their own place instead of one `middleware` folder. |
| **Learning curve** | Small API (`req`, `res`, `next`). The hard part is the decisions, not the framework. | Steeper: modules, providers, decorators, metadata, the request pipeline order and some rxjs. Mistakes can fail silently (a missing `@Injectable()` gave `undefined`). |
| **TypeScript support** | Added on top: `@types/express`, our own `RequestWithBody<T>`, declaring `req.user`. Zod gives types that always match the rules. | Built for TypeScript, and DI reads the constructor types. But types aren't checked at runtime: `year: number` was still `"1965"` without the pipe, and a DTO's type and its rules can disagree. |
| **Testing** | Our services take their dependencies as arguments, so tests pass fakes in directly with `node --test`. No framework involved. | `Test.createTestingModule` builds the module and `overrideProvider` swaps in fakes. Spec files are generated with each class. More setup per test, but the same pattern everywhere. |
| **Team onboarding** | A new developer has to learn our conventions from our code (`servicesFor(req)`, where validation goes, the error shape). | Anyone who knows Nest knows where things are on day one, and the official docs describe our app's layout. |
| **Something the framework didn't anticipate** | Easy: it's plain functions, so we just write it. Our transaction trick rebuilds the services with the transaction's repositories in a few lines. | Harder: you work inside its model (one shared instance of each service), so the same trick needs request-scoped providers or a different design. You can still drop down to the raw Express `req`/`res`. |

## Task 2: The recommendation

- **Weekend prototype: Express.** I want something running in an hour,
  not a structure. A few routes in one file and zod is enough, and if
  the idea fails nothing was spent on setup.
- **The library system as it stands today: Express.** It already works,
  with about 25 endpoints, tests, its own error shape and the
  transaction trick. Its structure is close to what Nest would force
  anyway. Rewriting it in Nest would cost weeks and the users would see
  no difference.
- **Six developers and a five-year roadmap: Nest.** With six people the
  risk is everyone wiring things their own way, and over five years the
  endpoints and services keep growing. Nest's one-time learning cost is
  small next to that, every module looks the same, and new hires can
  find their way around without us explaining our conventions.

## Task 3: Was Week 7 wasted?

No. The case for "wasted" is that Nest gives the layers, the wiring and
the validation for free, so that week could have gone into features.
But before Week 7 I only made a route, a controller and a model, and put
all the logic in the controller. Splitting it into routes, controllers,
services and repositories by hand is how I learned why each layer
exists, and that is also why Nest was easy to understand and I could
see what it actually saves.

## Task 4: What's still outstanding

Ordered by what would hurt most to be missing at the panel:

1. **It isn't deployed.** No live URL for the API, the database or the
   frontend yet.
2. **The API won't start on a host as it is.** There is no `start`
   script, `prisma generate` isn't part of a build (`src/generated/` is
   git-ignored), and nothing runs `prisma migrate deploy` on the hosted
   database.
3. **Login won't survive a reload in production.** The refresh cookie is
   `sameSite: "strict"`, so if the frontend and API are on different
   sites the browser never sends it and everyone gets logged out after
   15 minutes or on refresh. `CORS_ORIGIN` also has to be the real
   frontend URL.
4. **Deep links 404 on a static host.** The frontend uses
   `BrowserRouter`, so refreshing `/books/<id>` needs a rewrite to
   `index.html`, which we don't have.
5. **No demo data or accounts on the hosted database.** The seed is
   blocked by `ALLOW_SEED=false`, so we need a one-time seed and a login
   for each role (member, librarian, admin, super admin) to show the
   panel.
6. **Free hosting sleeps.** The first request can take 30+ seconds, and
   while it's asleep the cron jobs (hold expiry, due reminders) don't run
   and sockets drop. It has to be woken before the demo.
7. **READMEs don't have the live URLs, deploy steps or demo logins.**
   Postman also needs a production environment.

**Does it fit in tomorrow?** No, not all of it.

| Tomorrow | Sheet | Realistic |
| --- | --- | --- |
| Ex13 Both halves, in production | 85 min | 3-4 hours, since it's my first deploy and items 1-6 above all land here |
| Ex14 README, architecture, decisions | 50 min | about 2 hours (the clone-and-follow test alone needs a fresh database) |
| Ex15 Demo and being broken | 60 min | about 2 hours, and the "broken on purpose" part needs another person twice |

That's 7-8 hours against a 195-minute sheet. The list above mostly
overlaps with Ex13, so it doesn't add much on top, but the code fixes
(items 2-4) do. So the plan is: do items 2-4 this evening since they
are small and don't need a host, deploy first thing tomorrow, then
Ex14. Ex15's rehearsals, the break-and-fix practice and the recording
move to Friday morning before the panel.

## Fixes done before Exercise 13

From the list above, the ones that didn't need a host yet:

- **API can start on a host:** `library-api/package.json` now has
  `start` (`node src/server.ts`), `build` (`prisma generate`) and
  `db:migrate` (`prisma migrate deploy`), and `engines` asks for Node 24
  since it runs the `.ts` files directly.
- **Refresh cookie across sites:** `sameSite` now comes from a new
  `COOKIE_SAME_SITE` variable. It stays `strict` locally and is `none`
  (with `secure`) in production, because the frontend on Vercel and the
  API on Render are different sites. The config refuses `none` outside
  production. Logout clears the cookie with the same options, otherwise
  the browser ignores the clear.
- **Rate limits behind Render's proxy:** new `TRUST_PROXY` variable (`1`
  in production) so `req.ip` is the visitor's IP and not the proxy's.
  Without it every visitor would share one login limit.
- **Deep links:** `library-web/vercel.json` rewrites every path to
  `index.html`, so refreshing `/books/<id>` loads the app instead of a
  404.

Both new variables are in `.env.example` and `.env.production.example`.

# Exercise 13 — Both halves, in production

## Task 1: The hosted database

I used Neon (free Postgres), region AWS Singapore since it's the closest
to Karachi. I ran `prisma migrate deploy` against it from my machine,
and all 16 migrations applied. Then I ran the seed from my machine with
the Neon URL, since the seed refuses to run with `NODE_ENV=production`:
18 books (enough for two pages), 10 members (with a login for each of
the four roles) and 3 borrow requests.

What I had to change about the connection:

- **Two connection strings.** Neon gives a pooled one (host ends in
  `-pooler`) and a direct one. The app uses the pooled one, and
  migrations use the direct one, because the pooler runs in transaction
  mode and Prisma's migrate needs a normal session. I added an optional
  `DIRECT_DATABASE_URL` that `prisma.config.js` uses. Locally it isn't
  set, so it falls back to `DATABASE_URL`.
- **SSL.** Neon only accepts SSL connections. Its string has
  `sslmode=require`, and `pg` printed a warning that it treats that as
  `verify-full`. So I put `sslmode=verify-full` in the URL to say what
  actually happens.
- **The database sleeps.** Neon's free compute stops when idle. The
  first connection after a break was dropped ("terminating connection
  due to administrator command") and the retry worked.
