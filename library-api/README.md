# library-api

The backend of the Karachi Central Library system. Members request books,
librarians approve loans, overdue loans build up fines, and a queue forms
when no copy is on the shelf. Changes are pushed to open screens in real
time.

The frontend is in [`../library-web`](../library-web/README.md). How the
pieces fit together is in [`../ARCHITECTURE.md`](../ARCHITECTURE.md).

## Deployed

- API: https://karachi-library-api.up.railway.app (health check: `GET /`)
- Frontend: https://karachi-library.vercel.app

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Member (user) | `sara.malik@lib.pk` | `Library@2026` |
| Librarian | `librarian@lib.pk` | `Librarian@2026` |
| Admin | `admin@lib.pk` | `Admin@2026` |
| Super admin | `admin-test@lib.pk` | `LibraryAdminTest2026!` |

A second member, `usman.tariq@lib.pk` / `Library@2026`, is there for the
queue demo. They exist locally after the seed and on the deployed version.

## Stack

- Node.js 24 (runs the `.ts` files directly, no build step for the code)
- Express 5, TypeScript, zod for validation
- PostgreSQL with Prisma 7 (`@prisma/adapter-pg`)
- JWT access tokens and an httpOnly refresh token cookie, bcrypt
- Socket.IO for live updates, node-cron for the scheduled jobs
- helmet, CORS and express-rate-limit
- Tests with `node --test`, a Postman collection in `postman/`

## Install

You need Node.js 24 or newer and PostgreSQL running locally.

```bash
cd library-api
npm install
```

Newer npm versions may warn that the install scripts of `prisma` and
`@prisma/engines` were not run. That's fine, nothing needs to be approved.

## Configure

Copy the example file and fill it in:

```bash
cp .env.example .env
```

On Windows Command Prompt use `copy .env.example .env`.

In `.env`, set at least:

- `DATABASE_URL`: your local database, for example
  `postgresql://postgres:postgres@localhost:5432/karachi_library`
- `JWT_SECRET`: a long random string. To make one:
  `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`
- `ALLOW_SEED=true` (already set in the example), so the seed is allowed to
  run on this machine

Every other variable has a working local value in `.env.example`. If one is
missing or wrong, the API stops at startup and names it.

## Database, migrations and seed

Create the Prisma client, the database and its tables, and the demo data:

```bash
npm run build
npm run db:migrate
npm run db:seed
```

`db:migrate` creates the database named in `DATABASE_URL` if it doesn't
exist yet, so there is nothing to create by hand.

The seed empties the books, members, borrow requests, notifications and
tokens, and puts the demo data back. Run it again whenever you want a clean
start.

## Start

```bash
npm run dev
```

The API listens on http://localhost:3000. Opening it in a browser shows
`{"message":"Library API is running"}`. `npm start` runs it without
restarting on changes.

## Tests

```bash
npm test
```

## Postman

Import `postman/library-api.postman_collection.json` and
`postman/library-api.postman_environment.json`, set `baseUrl` to
`http://localhost:3000`, run `npm run db:seed`, and start the API with a
short token so the "Let it expire" step passes:

```bash
JWT_EXPIRES_IN=10s npm run dev
```

On Windows PowerShell: `$env:JWT_EXPIRES_IN="10s"; npm run dev`

Or from the terminal:

```bash
npx newman run postman/library-api.postman_collection.json -e postman/library-api.postman_environment.json --env-var baseUrl=http://localhost:3000
```

The collection changes some rows, so seed again before the next run.

## Production

The deployed API runs on Railway with a Neon PostgreSQL database. All the
production variables are listed in `.env.production.example`. Build command
`npm run build && npm run db:migrate`, start command `npm start`.
