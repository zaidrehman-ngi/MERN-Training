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


# Exercise 3

### Task 1

Added Morgan for request logging and compared the `dev` and `combined` formats. The `dev` format is shorter and easier to read during development, while `combined` includes additional details such as the client IP, timestamp, HTTP version, referrer, response size, and user-agent. These extra fields are useful for production monitoring, debugging, security investigation, and log analysis.

Configured Morgan with a writable stream so the combined logs are written to `logs/access.log` while also being shown in the terminal.


### Task 2

Recorded the response headers before and after adding Helmet. Before Helmet, the response mainly contained standard headers such as `ETag`, `Keep-Alive`, and `X-Powered-By`. After adding Helmet, several security-related headers were added, including CSP, HSTS, `X-Content-Type-Options`, and `X-Frame-Options`.

Three examples:

* `X-Content-Type-Options: nosniff` — makes MIME-sniffing attacks harder.
* `X-Frame-Options: SAMEORIGIN` — makes clickjacking harder.
* `Strict-Transport-Security` — helps prevent HTTP downgrade or SSL-stripping attacks by enforcing HTTPS.

The `Content-Security-Policy` header can break frontend images or scripts loaded from other origins. If external assets are needed, their origins must be explicitly allowed in directives such as `img-src` or `script-src`.


### Task 3

Added a `console.log` inside the books handler and triggered the request from the frontend running on port 5173.

The browser showed a CORS error because the API response did not contain an `Access-Control-Allow-Origin` header. However, the API terminal showed that the request reached the server and the handler ran:

```text
BOOKS HANDLER RAN
GET /api/v1/books HTTP/1.1" 304
```

The same endpoint was then tested with `curl`:

```bash
curl http://localhost:3000/api/v1/books
```

`curl` received the JSON response successfully. This confirmed that the API and route were working, and that the browser was the part blocking access to the response.

**Conclusion:** CORS is enforced by the browser to control which frontend origins can read API responses; it does not protect the API server from receiving the request.


### Task 4

Installed the `cors` middleware and configured it with the specific frontend origin:

```js
cors({
  origin: "http://localhost:5173",
})
```

After adding the middleware, the browser no longer reported a CORS error for requests from the frontend.

Using `origin: "*"` would allow any website to read responses from the API. This is convenient for public APIs, but it gives up origin-level access control. Since the API will carry login-related data and tokens next week, allowing every origin would make it possible for any website to be permitted to read API responses, increasing the risk of exposing sensitive data.


### Task 5

Changed the frontend update request to use `PUT` with a JSON body and the custom `X-Test` header. The browser sent two requests instead of one:

```text
OPTIONS /api/v1/books/bk-2
PUT /api/v1/books/bk-2
```

The first request is an `OPTIONS` preflight request. The browser uses it to ask the server whether the frontend origin is allowed to make the requested `PUT` request and use the requested headers. The server responds with the appropriate CORS headers, and the browser then sends the actual `PUT` request.

CORS-safelisted requests can avoid the preflight round trip, such as simple `GET` requests and certain `POST` requests using safelisted content types such as `text/plain`, `application/x-www-form-urlencoded`, or `multipart/form-data`. Requests using methods such as `PUT`, custom headers, or `application/json` trigger a preflight.


### Task 6

Set `credentials: true` in the CORS configuration and `withCredentials: true` in the Axios client while keeping `origin: "*"`.

The browser blocked the request because credentialed CORS requests cannot use the wildcard `*` as the allowed origin:

```text
The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'.
```

When credentials such as cookies are allowed, the server must specify the exact allowed origin instead of allowing every origin. This connects to the previous cookie decision because the JWT is stored in an `httpOnly` cookie, so cross-origin requests that need to send the cookie require an explicit allowed origin.


# Exercise 4

### Task 2

Added a handwritten `/files/:filename` route using `path.join()` and `fs.createReadStream()`, then piped the stream to the response.

After setting the response `Content-Type` to `image/jpeg`, the route successfully served the image in the browser.


### Task 3

Tested the three paths against both the hand-written `/files/:filename` route and the `express.static` `/uploads` route using `curl --path-as-is`.

#### Hand-written route

| Path               | Result                                  |
| ------------------ | --------------------------------------- |
| `/files/dune.jpg`  | `200 OK` — image served successfully    |
| `/files/../.env`   | `404 Not Found`                         |
| `/files/..%2f.env` | `200 OK` — `.env` contents were exposed |

The encoded path traversal was able to reach the hand-written route. After URL decoding, `path.join()` normalized the path outside the `uploads` directory, allowing `fs.createReadStream()` to read the `.env` file.

#### `express.static` route

| Path                 | Result                               |
| -------------------- | ------------------------------------ |
| `/uploads/dune.jpg`  | `200 OK` — image served successfully |
| `/uploads/../.env`   | `404 Not Found`                      |
| `/uploads/..%2f.env` | `404 Not Found`                      |

The `express.static` route prevented both traversal attempts from serving the `.env` file.

**Conclusion:** The hand-written file-serving route is vulnerable to encoded path traversal, while `express.static` safely restricts file access to the configured `uploads` directory.


### Task 4

Fixed the handwritten `/files/:filename` route by resolving the `uploads` directory and requested file to absolute paths, then checking that the requested path remains inside the `uploads` directory before creating the file stream.

Tested all three requests with `curl --path-as-is`:

| Path               | Result                                     |
| ------------------ | ------------------------------------------ |
| `/files/dune.jpg`  | `200 OK` — image still served successfully |
| `/files/../.env`   | `404 Not Found`                            |
| `/files/..%2f.env` | `404 Not Found` — `File not found.`        |

The fix prevents path traversal while still allowing valid files inside the `uploads` directory to be served.


### Task 5

Added `maxAge: "1h"` to the `express.static` middleware. The response now includes `Cache-Control: public, max-age=3600`, and the browser showed `304 Not Modified` with `ETag` and `If-None-Match`.

If a cover changes, a member with a cached copy could continue seeing the old version for up to 1 hour. For files that can change, I would use versioned filenames or adjust the cache duration. This is the same stale-cache issue we saw with yesterday's `301` redirect.


### Task 6

Assembled the middleware stack in `app.js` in the following order:

* **Security headers (`helmet`)** — placed early so security headers are applied to responses from the rest of the application.
* **Logging (`requestLog` and Morgan)** — placed early so requests to the following middleware and routes are recorded.
* **CORS** — placed before routes so API responses include the required CORS headers.
* **Body parsing (`express.json`)** — placed before routes that need to read `req.body`.
* **Cookie parsing (`cookieParser`)** — placed before authentication middleware and routes that need to read cookies.
* **Static files** — placed before API routes so upload requests can be handled directly.
* **API routes** — handle the application's actual API requests.
* **404 handler** — placed after the routes so it only handles requests that did not match any route.
* **Error handler** — placed last so errors from middleware and routes can reach it.

Tested the middleware order by moving two pieces:

* Moving `express.json()` after the routes caused a POST request to fail validation because the JSON request body was not parsed.
* Moving the 404 middleware before the routes caused valid API requests such as `GET /api/v1/books` to return `404 Route not found`.

This confirmed that middleware order affects whether requests are parsed, handled, or stopped. Middleware such as `helmet`, CORS, and `express.json()` must come before the routes they affect, while the 404 and error handlers must come after the routes.
