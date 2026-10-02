# Exercise 1

### Task 1

Created reusable `requestLog` middleware that records the request start time and logs the method, path, status code, and duration when the response finishes. The `finish` event is used because the final status code is available when the response has been sent.


### Task 2

With `next()` removed from B, only A and B were logged, while C and D did not run. The client request remained pending because B neither called `next()` nor sent a response, and no Express error was produced. In a real codebase, I would recognise this from a request that hangs without a response or error and then check the middleware chain for a missing `next()` or response.


### Task 3

The four middleware registration forms are:

* Whole app: `app.use(middleware)`
* Mounted path: `app.use("/api/v1", middleware)`
* Single router: `router.use(middleware)`
* Single route: `app.get("/path", middleware, handler)`

I verified the scopes through logs: the request ID middleware ran for every request, the `/api/v1` middleware only ran for API requests, the books router middleware only ran for book requests, and the single-route middleware only ran for `/`.


### Task 4

Three middleware examples already used in the app are `express.json()`, `cookieParser()`, and `requestLog`. To write them myself, I would parse the request body, parse the incoming cookies, and record request timing/logging respectively, then call `next()` to continue the request.

The 404 handler is different because it is terminal middleware: instead of calling `next()`, it sends the final response. It must be registered after all routes so it only handles requests that did not match any earlier route.


### Task 5

Created error-handling middleware with four arguments `(err, req, res, next)`. Both a deliberate `next(err)` and an uncaught error thrown inside an async route reached the error handler in Express 5 and returned a 500 response.

In Express 4, rejected promises from async route handlers were not automatically forwarded to error middleware, so helpers such as `express-async-handler` were commonly used. In Express 5, that behavior is built in, so **I do not need that helper**.


### Task 6

* **Change the request:** `cookieParser()` changes the request by parsing cookies and adding them to `req.cookies`.
* **Change the response:** `requestLog` changes the response by adding a request-finish listener and logging the final status and duration.
* **Stop the request:** The 404 middleware stops the request by sending a 404 response instead of calling `next()`.

The dangerous one to get wrong is **stopping the request**, because forgetting to call `next()` can leave requests hanging, while stopping a request at the wrong point can prevent valid routes or middleware from running.


# Exercise 2

### Task 1

Created `requireAuth` middleware that reads the `Authorization` header, expects a Bearer token, verifies it using `jsonwebtoken` and the JWT secret, and attaches the decoded payload to `req.user` before calling `next()`.

Tested the real Week 1 tokens:

* Token A → `200` and the decoded librarian payload was attached to `req.user`.
* Token B → `401` because the token is expired, without producing a `500` error.


### Task 2

The four refusal cases are:

* **No token:** `401 Unauthorized` — authentication credentials were not provided.
* **Invalid token:** `401 Unauthorized` — the provided token could not be verified.
* **Expired token:** `401 Unauthorized` — the token was previously valid but is no longer valid because it has expired.
* **Valid token but insufficient permission:** `403 Forbidden` — the user is authenticated, but does not have permission to perform the action.

The three authentication failures use `401`, while the authorization failure uses `403`.


### Task 3

With the route registered before `requireAuth`, an unauthenticated request reached `approveHandler` and returned `200`, because the authentication middleware was registered too late.

After moving `router.use(requireAuth)` before the protected route, the same request without a token returned `401 Unauthorized`.

To prevent this mistake in the future, I would use a convention where authentication middleware is registered before all protected routes, and add tests that verify protected routes return `401` when no token is provided.


### Task 4

`requireRole()` is a middleware factory. It receives the required role as an argument and returns middleware that checks `req.user.role` before allowing the request to continue.

Applied role-based authorization to the protected routes:

* Approving a borrow request requires the `librarian` role.
* Deleting a book requires the `admin` role.
* Other protected routes use the required role allowlists from the API specification.
* Public catalogue routes do not require authentication.

#### Deliberately unauthenticated routes

* `POST /api/v1/auth/login` — allows users to log in and obtain authentication credentials.
* `POST /api/v1/users` — allows new members to register without already being authenticated.
* `GET /api/v1/books` — allows anyone to browse the library catalogue.
* `GET /api/v1/books/:id` — allows anyone to view details of a book.


### Task 5

Temporarily removed `return` from the `401` response and sent a request without a token.

The client received the expected `401` response, but the middleware continued executing and tried to run `authHeader.split()` even though `authHeader` was `undefined`. This caused a `TypeError`.

The error handler then tried to send a `500` response after the `401` response had already been sent, causing `ERR_HTTP_HEADERS_SENT`.

This is more dangerous than having no auth because the request is refused but the middleware still continues executing. Restored the `return` after testing.
