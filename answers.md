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

The mock database (`db.json`) was already gone. What was still left:

- `json-server` in devDependencies. Uninstalled.
- The README still said to start json-server on port 4000. Rewrote it to
  start `library-api` instead.
- `scripts/measure-polling.mjs`, a Week 4 script that measured the 3 second
  polling on the books page. The polling is removed, so the script went too.
- The borrow button sent a made-up request: `userId: "m-1000"`, status,
  dates and fine all built in the browser. It now sends only `{ bookId }`,
  the API takes the member from the token and sets the rest.
- Books without a cover pointed at `/covers/placeholder.jpg`, which only
  existed in the json-server setup, so they showed a broken image. The card
  now skips the image when there is no cover.
- The register page had the branch names hardcoded in an array. I added
  `GET /api/v1/branches` to the API (public, so it works before login) and
  the dropdown now loads from it.

What broke when I ran it:

1. Users and Borrow Requests pages: `401`, shown as "Something went
   wrong". The mock never asked for a login, the API does.
2. Borrow, Add, Edit and Delete book all need a logged in user (staff for
   add, edit and delete), so they fail the same way.
3. Add Book asks for a branch (Clifton, Defence, Gulshan), but books have
   no branch in the API and there is no Defence branch. It also never sends
   `year` or `finePerDay`, which the API requires, so it would get a `400`.
4. The edit form has no year or fine fields either.

## Task 4: The four states against the real API

I checked the catalogue and the book page with the network throttled, with
the API stopped, and with a book id that doesn't exist.

- Loading and loaded worked on both pages. With a slow API the catalogue
  shows "Loading books..." until the data comes, and if it takes over 10
  seconds Axios times out and the page shows the error with Retry.
- Empty worked: a search with no match shows "No books found".
- Error on the catalogue worked: with the API stopped it shows the
  connection error and Retry.

What only worked because of the mock:

1. The book page showed "Book Not Found" for every error, even when the API
   was just down. The mock was always up, so the only error it ever gave
   was a 404. Now a 404 shows "Book Not Found", anything else shows "Could
   not load this book" with a Retry button.
2. A bad id like `bk-1` gets a `400` from the real API, not a `404`, so it
   showed "Something went wrong". The book page treats 400 as not found too.
3. The Axios interceptor turned every `404` into "This book is no longer
   available", because books were the only thing the mock had. Now 4xx
   errors use the message the API sends back, so the users page says
   "Authentication required." instead of a book message.

## Task 5: Environment configuration on both sides

| | Local | Production |
|---|---|---|
| Frontend `VITE_API_URL` | `http://localhost:3000/api/v1` | `https://your-api-host/api/v1` |
| Backend `CORS_ORIGIN` | `http://localhost:5173` | `https://your-frontend-host` |

Each app has `.env.example` (local) and `.env.production.example`
(production), and both are committed. The real `.env` files stay
git-ignored. In production the values go in the hosting dashboard. The
frontend one has to be set before the build, since Vite writes it into the
bundle.

The usual way this goes wrong is a value that is slightly off and no error
anywhere: the API starts fine, the site loads, and every request is
blocked by CORS or goes to localhost. So I made both sides fail early:

- The API won't start if `CORS_ORIGIN` has a path or trailing slash
  (`https://site.com/` never matches the browser's `https://site.com`), or
  if it isn't https when `NODE_ENV=production`.
- `vite build` stops if `VITE_API_URL` isn't set, instead of building a
  site that calls `undefined`.
