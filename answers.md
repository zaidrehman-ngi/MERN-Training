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
