# Architecture

Two apps. `library-web` is a React app that runs in the browser (Vercel).
`library-api` is an Express server (Railway) that talks to PostgreSQL
(Neon). One Node process on the API side handles HTTP, the socket and the
scheduled jobs.

```
        Browser: library-web (React, Redux store)
          |                              ^
          | HTTP (Axios, JWT)            | Socket.IO (live updates)
          v                              |
+---------------------------------------------------------------+
| library-api (one Node process)                                |
|                                                               |
|  Middleware: request id, log, CORS, rate limit, auth, roles,  |
|              zod validation                                   |
|      |                                                        |
|      v                                                        |
|  Routes -> Controllers -> Services -> Repositories --+        |
|                              |    ^                  |        |
|                emits events   |    | calls            |        |
|                              v    |                  |        |
|                     Domain events  Scheduled jobs    |        |
|                          |         (node-cron:       |        |
|                          v          expire holds,    |        |
|                     Socket server   due reminders)   |        |
|                     (rooms: book,                    |        |
|                      member, counter)                |        |
+------------------------------------------------------|--------+
                                                       v
                                         PostgreSQL (Prisma)
```

**Layers.** Routes only list the endpoints and their middleware.
Controllers read the request and send the response. Services hold the
library rules (borrow limit, queue, fines, who may do what), and they are
the only layer that decides anything. Repositories are the only code that
talks to the database through Prisma, and they turn database rows
(`snake_case`) into the API's shape (`camelCase`).

**Where a request goes.** For example, a member borrowing a book: the
request passes the rate limit, `requireAuth` checks the token, `validate`
checks the body, the controller calls `borrowRequests.create`, the service
checks the rules and saves through the repository, and the controller
returns `201`. Any error thrown on the way ends in one error handler that
sends `{ error, message, details }`.

**Where the socket fits.** Socket.IO shares the same HTTP server and port.
Services don't know about sockets: after a change they emit a domain
event (book availability changed, request approved, queue moved), and the
socket server listens to those events and sends them to the right room:
everyone watching that book, that member, or the librarians' counter. The
frontend puts what arrives into the Redux store, so every screen reads the
same data.

**Where the scheduled job sits.** `jobs/scheduler.ts` starts two node-cron
jobs when the server starts, on Karachi time: expiring holds nobody
collected (00:05) and due-date reminders (08:00). They call the same
services as the routes, so the same rules and events apply. An admin can
also run the reminders by hand through `POST /api/v1/jobs/due-reminders/run`.
