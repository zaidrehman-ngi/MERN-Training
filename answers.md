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
