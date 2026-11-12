# Library API Specification

This describes what `library-api` and `library-web` do as of Week 8.

## Conventions

- Base URL: `/api/v1`. Paths are plural, lowercase, kebab-case
  (`/borrow-requests`).
- JSON keys are camelCase. The database is snake_case; the repositories
  translate, nothing else sees column names.
- Ids are UUIDs. A malformed id returns `400`, an unknown one `404`.
- Successful responses wrap the result in `data`:
  `{ "data": { ... } }` or `{ "data": [ ... ] }`. Responses that only
  confirm something return `{ "message": "..." }`. `DELETE` returns `204`
  with no body.
- `PATCH` is a partial update. There is no `PUT`.
- Unknown body fields are ignored, except on `PATCH /borrow-requests/:id`.
  Unknown query params on a list endpoint return `400`.

### Paging

Every list endpoint (`/books`, `/users`, `/borrow-requests`,
`/notifications`) pages the same way. Query: `page` (default 1) and
`limit` (default 10, at most 100). The response has the items in `data`
and the paging in `meta`:

```json
{ "data": [ ... ], "meta": { "page": 1, "limit": 10, "total": 23 } }
```

`total` is the number of matches across all pages, so the client knows how
many pages there are. `GET /branches` and `GET /borrow-requests/overdue`
are short lists and are not paged.

### Dates

- A library day (`dueDate`, `holdUntil`, `requestedAt`, `joined`, `forDate`)
  is `YYYY-MM-DD`. It is a day in the library's time zone (`Asia/Karachi`)
  and must be shown as is, never converted.
- A moment in time (`queuedAt`, `returnedAt`, `createdAt`) is ISO 8601 in
  UTC, e.g. `2026-11-12T20:30:00.000Z`.
- The server works out "today", due dates and overdue in `Asia/Karachi`,
  whatever time zone the host is in.

### Errors

Every error has the same shape:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Some fields have invalid values.",
  "details": [{ "field": "isbn", "message": "ISBN must be 13 digits." }]
}
```

| Status | `error` | When |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR`, `BAD_REQUEST` | invalid body, query or id; broken JSON |
| 401 | `UNAUTHORIZED` | no token, expired, logged out, wrong login |
| 403 | `FORBIDDEN` | logged in but not allowed |
| 404 | `NOT_FOUND` | no such book, user, request, branch or route |
| 409 | `CONFLICT`, `ISBN_TAKEN`, `EMAIL_TAKEN`, `BORROW_LIMIT_REACHED`, `REQUEST_CLOSED`, `REQUEST_QUEUED`, `NOT_CANCELLABLE`, `ALREADY_RETURNED`, `REQUEST_CHANGED` | the action clashes with the current state |
| 429 | `RATE_LIMIT_EXCEEDED` | too many requests |
| 500 | `INTERNAL_SERVER_ERROR` | anything unexpected (no internals in production) |

### Auth

- `POST /auth/login` returns a 15 minute access token. Send it as
  `Authorization: Bearer <token>`. The frontend keeps it in memory only.
- Login also sets a 7 day refresh token in an `httpOnly`,
  `SameSite=Strict` cookie, sent only to `/api/v1/auth`.
- `POST /auth/refresh` swaps the cookie for a new access token and a new
  cookie (rotation). The frontend calls it on page load and when a request
  gets `401`, then retries the request once.
- `POST /auth/logout` revokes the refresh token and puts the access token's
  `jti` on a denylist until it expires.

### Roles

`user`, `librarian`, `admin`, `super admin`. **Staff** = librarian, admin,
super admin. **Admin** = admin, super admin.

### Rate limits

All of `/api/v1`: 100 requests per 15 minutes. `POST /auth/login`: 5 per
15 minutes. `GET /books`: 60 per minute.

## Endpoints

| Method | Path | What it does | Who |
| --- | --- | --- | --- |
| POST | `/auth/register` | create a `user` account | public |
| POST | `/auth/login` | log in | public |
| POST | `/auth/refresh` | new access token from the cookie | refresh cookie |
| POST | `/auth/logout` | log out | logged in |
| GET | `/books` | list books, filtered and paged | public |
| GET | `/books/:id` | one book | public |
| POST | `/books` | add a book | staff |
| PATCH | `/books/:id` | change a book | staff |
| DELETE | `/books/:id` | remove a book (soft delete) | admin |
| GET | `/branches` | list branches | public |
| GET | `/users` | list users | staff |
| GET | `/users/:id` | one user | self or staff |
| PATCH | `/users/:id` | change a user | self or admin |
| DELETE | `/users/:id` | deactivate a user | admin |
| GET | `/borrow-requests` | list requests (a `user` sees only their own) | logged in |
| POST | `/borrow-requests` | request a book | logged in |
| GET | `/borrow-requests/overdue` | approved loans past their due date | staff |
| GET | `/borrow-requests/:id` | one request | owner or staff |
| PATCH | `/borrow-requests/:id` | approve, reject or reset to pending | staff |
| POST | `/borrow-requests/:id/cancel` | cancel a waiting request | owner |
| GET | `/borrow-requests/:id/queue` | place in the queue for the book | owner or staff |
| POST | `/borrow-requests/:id/return` | mark the book returned | staff |
| GET | `/notifications` | the caller's notifications | logged in |
| POST | `/jobs/due-reminders/run` | run the due reminder job now | admin |

### Books

`GET /books` query: `q` (title or author contains, any case), `status`,
`author`, `title` (exact), `available` (`true`/`false`), `sort` (`title`,
`author`, `year`), `order` (`asc`/`desc`), `page`, `limit`.

```json
{
  "data": [
    {
      "id": "e903e401-863a-4d38-9e72-5ea9b65ae470",
      "title": "Dune",
      "author": "Frank Herbert",
      "year": 1965,
      "isbn": "9780441013593",
      "coverUrl": "/covers/dune.jpg",
      "onShelf": 3,
      "totalCopies": 5,
      "finePerDay": 20,
      "status": "available"
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 9 }
}
```

`status` is one of `available`, `out`, `overdue`, `RESERVED_STACK`.
`coverUrl` can be `null`.

`POST /books` body: `title`, `year`, `isbn` (13 digits), `onShelf`,
`totalCopies`, `finePerDay`, `status` required; `author`, `coverUrl`
optional. `PATCH` takes any of the same fields. A duplicate ISBN returns
`409 ISBN_TAKEN`.

### Users and registration

`POST /auth/register` body: `name`, `email`, `password` (8 characters to
72 bytes), `branch` (a branch name from `GET /branches`). The server sets
`role: "user"` and `joined` to today. The response is always
`201 { "message": "Registration received. ..." }`, whether or not the email
was already taken, so the form can't be used to find accounts.

```json
{
  "id": "b27f1005-5dd2-46f1-bf8e-8ec544dca67a",
  "name": "Aisha Khan",
  "email": "aisha0@lib.pk",
  "role": "admin",
  "branch": "Clifton Branch",
  "joined": "2018-01-15"
}
```

`PATCH /users/:id` takes `name`, `email`, `branch`, `password`, `role`,
`joined`. Nobody can change their own role. Only a super admin can make or
change an admin.

`GET /users` query: `q` (name, email or branch contains, any case), `role`,
`page`, `limit`. Returns active users sorted by name.

### Login and refresh

```json
{
  "data": {
    "accessToken": "<jwt>",
    "user": {
      "id": "b27f1005-...",
      "name": "Aisha Khan",
      "email": "aisha0@lib.pk",
      "role": "admin"
    }
  }
}
```

Login and refresh return the same shape. Logout returns
`{ "message": "Logged out successfully." }`.

### Borrow requests

`POST /borrow-requests` body: `{ "bookId": "<uuid>" }`. The user comes from
the token. The server sets the status, the dates and the fine. If a copy is
on the shelf the request is `pending`; if not, it is `queued`. A member can
have at most 5 open requests (`409 BORROW_LIMIT_REACHED`).

`PATCH /borrow-requests/:id` body: `{ "status": "approved" | "rejected" | "pending" }`.
Approving takes a copy off the shelf and sets `dueDate` to today + 14
days. Staff can't decide their own request.

Statuses: `pending` → `approved` → `returned`; `queued` → `held` (a copy
is kept for 3 days) → `approved`; `rejected`, `cancelled` and `expired`
are final.

`GET /borrow-requests` query: `q` (book title or member name contains, any
case), `userId`, `bookId`, `status`, `page`, `limit`. A `user` only gets
their own requests, whatever `userId` says. The list, the detail and
`/overdue` all return the same shape:

```json
{
  "id": "ad1f6753-...",
  "bookId": "e903e401-...",
  "userId": "b27f1005-...",
  "status": "approved",
  "requestedAt": "2026-11-10",
  "dueDate": "2026-11-24",
  "queuedAt": null,
  "holdUntil": null,
  "finePerDay": 20,
  "returnedAt": null,
  "fine": 0,
  "user": { "id": "b27f1005-...", "name": "Aisha Khan", "email": "aisha0@lib.pk" },
  "book": { "id": "e903e401-...", "title": "Dune", "author": "Frank Herbert" }
}
```

`fine` is the charge once returned; while the book is still out it is
what the fine comes to today (Rs. `finePerDay` per late day, at most 30
days).

`GET /borrow-requests/:id/queue` returns
`{ "data": { "id", "bookId", "status", "position" } }`. `position` is
`null` when the request isn't queued.

### Notifications

`GET /notifications?page=1&limit=10` returns the caller's notifications,
newest first:

```json
{
  "id": "...",
  "userId": "...",
  "borrowRequestId": "...",
  "kind": "due-reminder",
  "message": "\"Dune\" is due back on 2026-11-24.",
  "forDate": "2026-11-24",
  "createdAt": "2026-11-22T03:00:00.000Z"
}
```

`kind` is `due-reminder` or `hold-ready`.

## Real-time (Socket.IO)

Connect to the API's origin with `auth: { token: <access token> }`. A bad
or missing token is refused. When the token expires the server sends
`server:session:expired` and disconnects.

Server to client:

| Event | Sent to | Payload |
| --- | --- | --- |
| `server:presence:changed` | everyone | `{ members, sockets }` |
| `server:book:availability-changed` | watchers of the book | `{ bookId, available }` |
| `server:borrow-request:created` | staff | `{ id, bookTitle, userName, requestedAt }` |
| `server:borrow-request:status-changed` | the owner | `{ id, bookId, status }` |
| `server:loan:due-soon` | the owner | `{ borrowRequestId, bookTitle, dueDate, message }` |
| `server:queue:position-changed` | the owner | `{ bookId, position }` |
| `server:queue:promoted` | the owner and staff | `{ bookId, bookTitle, holdUntil }` |
| `server:session:expired` | the socket | none |

Client to server (each gets an ack `{ ok: true, ... }` or
`{ ok: false, error, message }`):

| Event | Who | Payload |
| --- | --- | --- |
| `client:book:watch` | anyone connected | `{ bookId }` |
| `client:book:unwatch` | anyone connected | `{ bookId }` |
| `client:borrow-request:decide` | staff | `{ id, status: "approved" \| "rejected" }` |

## Scheduled jobs

- Due reminders: every day at 08:00 Karachi time. A member gets one
  notification per loan two days before it is due.
- Hold expiry: every day at 00:05. Holds past `holdUntil` become `expired`
  and the copy goes to the next in the queue or back on the shelf.

## What the frontend uses

| Page | Calls |
| --- | --- |
| Register | `GET /branches`, `POST /auth/register` |
| Login / Header | `POST /auth/login`, `/auth/refresh`, `/auth/logout`; socket connect |
| Books | `GET /books` with `q`, `status`, `page` |
| Book detail | `GET /books/:id`, `POST /borrow-requests` |
| Add / Edit book (staff) | `POST /books`, `PATCH /books/:id` |
| Borrow requests (logged in) | `GET /borrow-requests` with `q`, `status`, `page` |
| Users (staff) | `GET /users` with `q`, `role`, `page` |

Not used by the frontend yet: approving, rejecting, cancelling and returning
requests, the queue, notifications, overdue, user editing, and the socket
events other than connect.
