# Exercise 1

### Task 1

I used `safeParse` because it returns a result object instead of throwing an exception when validation fails. This allows the handler to check the validation result and return the appropriate Week 1 error response to the client.

`parse` throws a Zod error when validation fails, so it would need to be handled with `try/catch`. I would use `parse` when invalid data should immediately throw an error and I am handling that error separately, rather than returning a validation response directly from the handler.


### Task 2

The initial validation failed because `"copies": "3"` was a string while the schema expected a number. After changing the schema to use `z.coerce.number()`, validation passed and `"3"` was converted to `3`.

The handler that saved `req.body` stored all the fields sent by the client, including `role: "admin"` and `id: "bk-1"`.

The handler that saved `result.data` stored only the fields defined in the schema:

```json
{
  "title": "Dune",
  "copies": 3
}
```

This shows why the handler should use the validated result instead of saving `req.body` directly. Saving `req.body` can allow unexpected client-controlled fields such as `role` and `id` to be stored.


### Task 3

I created Zod schemas for the catalogue query parameters and the book ID path parameter. Query parameters such as `page` and `limit` arrive as strings, so `z.coerce.number()` converts them into numbers. Missing `page` and `limit` use sensible defaults of `1` and `10`.

A request such as `?page=banana` returns `400 Bad Request` because the value was provided but cannot be converted into a valid number. This is different from a missing `page`, where using the default value of `1` is appropriate because the client did not provide a value.


### Task 6

The Week 3 form checks email format, an eight-character minimum password, and matching confirmation. The backend schema checks email format and password length too, because frontend checks can be bypassed. Confirmation stays on the frontend: it is not sent to the API.

We could remove frontend validation without making the API unsafe, but users would lose immediate feedback. Removing backend validation might go unnoticed in the form, but would leave the API unprotected.


# Exercise 2

### Task 2

The API now forwards expected errors to one error handler, which returns the appropriate status and safe response. Unexpected errors are logged with their stack trace but return a generic 500 message. I removed 128 lines of inline error responses: 90 from controllers and 38 from middleware and routes. There were no controller `try/catch` blocks to remove.

### Task 3

For `/a`, Express catches the thrown string and sends it to the error handler, which returns a generic 500 response. The server stays running.

For `/b`, the async handler returns a promise. Throwing inside it makes that promise fail, and Express 5 forwards the failure to the error handler. The client receives a generic 500 response, and the server stays running.

For `/c`, the handler starts an async operation but does not wait for it or return its promise. The handler sends a 200 response first; when the promise fails, Express does not see the failure, so it never reaches the error handler. In the test, Node exited because the rejection was unhandled.

This is dangerous because the client is told the request succeeded even though the async work failed. The unhandled rejection can also stop the whole server.

### Task 6

An **operational error** is an expected failure during normal use or from a dependency, which the API can report safely.

A **programmer error** is a bug or server configuration mistake that needs investigation and fixing.

| Case | Type | What the user sees | What we do |
|---|---|---|---|
| Duplicate ISBN | Operational | `409 Conflict` saying the ISBN is already in use. | Keep the existing book; user can submit a different ISBN. |
| Missing environment variable | Programmer/configuration | Generic `500` response. | Log the missing setting, fail startup, and correct deployment configuration. |
| Bad JWT | Operational | `401 Unauthorized` asking the user to authenticate again. | Do not log the token; investigate only if failures suggest an auth-system problem. |
| Null dereference | Programmer | Generic `500` response. | Log the error with its stack and request ID, then fix and test the code. |
| Database is down | Operational dependency failure | `503 Service Unavailable` with a safe retry message. | Log and alert, restore the database, and retry only where safe. |
| Request for a deleted book | Operational | `404 Not Found` saying the book is unavailable. | Return not found; do not expose internal details. |

# Exercise 3

### Task 1

The API reads its port, JWT secret and expiry, CORS origin, uploads directory,
rate-limit window and maximum, and log level from environment variables.
`.env` is ignored by Git; `.env.example` contains placeholders only.

Node also supports `--env-file` natively. I tested it with `.env.example`;
dotenv is still useful because it loads settings consistently across Node
versions and start commands.

### Task 2

`src/config/config.js` is the only project file that reads environment
variables. This keeps configuration consistent and lets the app validate it
once at startup. It also makes two things easier: running the same code with
different settings in development, testing, and production, and testing
startup with controlled configuration values.

### Task 3

At startup, Zod checks every required setting and reports invalid or missing
values by environment variable name. The server exits before listening if
configuration is invalid. This catches a bad deployment when it starts, so
the developer or operator sees it before a user encounters it on a request.

### Task 4

`NODE_ENV` is set in `.env` for local development and in the deployment
environment for production. Development errors include the error message in
the response and log the stack; production errors return a generic message
and log no stack. Morgan uses its concise `dev` format locally and `combined`
in production. Neither environment sends a stack trace to the client.

### Task 5

**Belong in code**

1. API routes and controller behavior.
2. Zod validation rules.
3. Authorization rules, such as which roles can manage books.

**Belong in environment variables**

4. `PORT` and `NODE_ENV`.
5. `CORS_ORIGIN`.
6. `UPLOADS_PATH`.
7. `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX`.
8. `LOG_LEVEL`.
9. `JWT_EXPIRES_IN`.

**Belong in neither**

10. The JWT signing secret and persistent user, book, and borrow-request data.
    The secret belongs in a deployment secret manager; the records belong in
    a database, not in code or environment variables. In Week 8, use the
    deployment platform's secret store for the JWT secret and database
    credentials, and a managed persistent database for application data.
    The local `.env` is only a staging post for development, not the place to
    keep production secrets.
