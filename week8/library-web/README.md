# library-web

The frontend of the Karachi Central Library system. Members search the
catalogue and borrow books, librarians approve requests, and admins manage
members, each seeing their own pages, with availability updating live.

It needs the API in [`../library-api`](../library-api/README.md) running.
How the pieces fit together is in [`../ARCHITECTURE.md`](../ARCHITECTURE.md).

## Deployed

- Frontend: https://karachi-library.vercel.app
- API: https://karachi-library-api.up.railway.app

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Member (user) | `sara.malik@lib.pk` | `Library@2026` |
| Librarian | `librarian@lib.pk` | `Librarian@2026` |
| Admin | `admin@lib.pk` | `Admin@2026` |
| Super admin | `admin-test@lib.pk` | `LibraryAdminTest2026!` |

A second member, `usman.tariq@lib.pk` / `Library@2026`, is there for the
queue demo.

## Stack

- React 19 with Vite
- React Router, Redux Toolkit
- Axios (token refresh in an interceptor), Socket.IO client
- CSS Modules, react-hot-toast

## Install

You need Node.js 24 or newer.

```bash
cd library-web
npm install
```

## Configure

```bash
cp .env.example .env
```

On Windows Command Prompt use `copy .env.example .env`.

`VITE_API_URL` must point at the API, `http://localhost:3000/api/v1` when it
runs locally. Anything starting with `VITE_` ends up in the browser, so no
secrets go in this file.

## Database, migrations and seed

The frontend has no database of its own. Set up the API first: its README
covers the database, the migrations and the seed.

## Start

Start the API in one terminal:

```bash
cd library-api
npm run dev
```

Then the app in a second terminal:

```bash
cd library-web
npm run dev
```

Open http://localhost:5173 and log in with one of the demo accounts. The API
only accepts this origin (`CORS_ORIGIN` in the API's `.env`), so keep the
app on port 5173.

## Production

Deployed on Vercel from the `master` branch with root directory
`week8/library-web`. Set these before the
build, because Vite writes them into the bundle:

- `VITE_API_URL=https://karachi-library-api.up.railway.app/api/v1`
- `VITE_AUTH_URL=/api/v1`

`vercel.json` sends every route to `index.html` so a refresh on
`/books/<id>` works, and forwards `/api/v1/auth/*` to the API so the
refresh cookie belongs to this site.
