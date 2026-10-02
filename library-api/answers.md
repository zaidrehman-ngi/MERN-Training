# Exercise 1

### Task 2

Express version: 5.2.1

Five things Express handled for us:

1. **Routing** — Express lets us define routes like `app.get("/books", ...)` instead of checking `req.method` and `req.url` manually.
2. **HTTP methods** — `app.get()` directly handles GET requests, so we do not need to check the method ourselves.
3. **JSON responses** — `res.json()` converts the JavaScript object to JSON and sends it as the response.
4. **Content-Type header** — Express sets the JSON `Content-Type` header automatically when using `res.json()`.
5. **404 handling** — We can add one middleware for requests that do not match any route instead of manually handling the fallback in the server logic.

Express is not the server itself. It is a web framework for Node.js that provides routing, middleware, request/response handling, and other utilities. The HTTP server underneath is still provided by Node.js. When `app.listen()` is called, Express uses Node's `http` server underneath to listen for incoming network requests.


### Task 4

In Express, define more specific/static routes before dynamic parameter routes, because Express matches routes in the order they are registered.


### Task 5

For the catch-all 404, I used `app.use()` instead of `app.get("*")`. Express 5 does not support the old `app.get("*")` pattern.

The catch-all middleware is placed after all the valid routes and routers because Express processes middleware in registration order. If it were placed earlier, it would catch the request before the correct route could handle it.

The catch-all returns the Week 1 error shape instead of Express's default HTML 404 page.


### Task 6

The `api-spec.md` was created in Week 1, while the actual `db.json` was provided in Week 4, so some sample payloads did not match the actual data structure.

Updated the spec to match `db.json`:

* **User:** Replaced `phone` and `membershipStatus` with `branch` and `joined`.
* **Book:** Replaced `availableCopies` with `onShelf` and added `coverUrl`, `totalCopies`, `finePerDay`, and `status`.
* **Borrow Request:** Added `dueDate` and `finePerDay` and updated the ID/data format.
* Updated the related list and login response examples with the actual data structure.

The conventions, endpoints, and query parameters were kept unchanged because they matched the implementation.


# Exercise 2

### Task 1

Without `express.json()`, `req.body` was `undefined` because the incoming JSON data arrives as a request stream and is not parsed automatically.

The one-line fix was:

```js
app.use(express.json());
```

It must be placed **before the routes** so the middleware reads the incoming request stream, parses the JSON body, and makes the parsed object available through `req.body` to the route handler.


### Task 2

Tested the same object with `res.send()`, `res.json()`, and `res.end()`.

* `res.send(object)` → `application/json; charset=utf-8`
* `res.json(object)` → `application/json; charset=utf-8`
* `res.end(object)` → `text/html; charset=utf-8`

Then tested different values with `res.send()`:

* String → `text/html; charset=utf-8`
* Number → `application/json; charset=utf-8`
* Array → `application/json; charset=utf-8`

`res.send()` automatically determines the response type based on the value, so a string was treated as HTML instead of JSON.

For the rest of the project, I will use **`res.json()`** for API responses because the API is designed to return JSON, and `res.json()` makes the response format explicit and consistent.


### Task 3

The required status codes were already implemented in the book controller, so I verified all five cases in Postman:

| Case                                         |          Status |
| -------------------------------------------- | --------------: |
| Book created successfully                    |     201 Created |
| Book deleted successfully, nothing to return |  204 No Content |
| Book ID does not exist                       |   404 Not Found |
| Book created with no title                   | 400 Bad Request |
| Duplicate ISBN                               |    409 Conflict |

For successful book creation, I added a `Location` header containing the URL of the newly created book, for example:

`Location: /api/v1/books/bk-160`

A client can use this URL to retrieve the newly created resource.

All five results matched my Week 1 predictions, so I do not disagree with any of them.


### Task 4

Tested two deliberately broken handlers.

Calling `res.json()` twice returned the first response to the client, while the terminal showed:

`ERR_HTTP_HEADERS_SENT: Cannot set headers after they are sent to the client`

The second test sent a normal response and then continued executing code afterward. The client still received the response, while the additional work continued on the server.

The rule is that once a handler sends a response, it should stop execution and should not try to send another response or continue with unnecessary work.

The missing keyword in the second case is **`return`**.


### Task 5

A response has three main parts:

* **Status code:** Read mainly by the frontend code and sometimes the browser/proxy to understand the result of the request. For example, `404` tells the frontend that the requested book does not exist.
* **Headers:** Read by the browser, frontend code, and proxies to understand metadata about the response. Today, `Content-Type` showed whether the response was being sent as JSON or HTML, and the `Location` header told the client where the newly created book can be found.
* **Body:** Read by the frontend code or human when inspecting the response. It contains the actual response data or error details.

One example of getting it wrong today was using `res.send("Dune")`. The response looked fine on screen, but Express returned `Content-Type: text/html` instead of JSON. The data looked correct to a human, but the response metadata was wrong for an API.

This shows how an API can look correct to a human while giving the wrong information to the machine consuming it.


# Exercise 3

### Task 1

Installed `cookie-parser` and added it as middleware so the application can read cookies through `req.cookies`.

Updated the login controller to set the JWT as an `accessToken` cookie. Added a temporary `/test-cookie` route to read the cookie back using `req.cookies.accessToken`.

Tested the flow in Postman:

* `POST /api/v1/auth/login` successfully returned a `Set-Cookie` header containing the `accessToken`.
* `GET /api/v1/auth/test-cookie` successfully read the same cookie and returned the access token.
* Also confirmed the cookie was available in the terminal through `req.cookies`.


### Task 2

Updated the `accessToken` cookie with the following flags:

* `httpOnly: true` — prevents client-side JavaScript from directly accessing the cookie, reducing the risk of token theft through XSS.
* `sameSite: "strict"` — prevents the cookie from being sent with cross-site requests, reducing the risk of CSRF.
* `maxAge: 60 * 60 * 1000` — makes the cookie expire after one hour.

Verified the raw `Set-Cookie` header in Postman. It contained:

* `Max-Age=3600`
* `HttpOnly`
* `SameSite=Strict`

The fourth flag is `Secure`. It makes the browser send the cookie only over HTTPS, but it could not be meaningfully tested in the current localhost setup because the API is running over HTTP.

The JWT storage decision was revisited separately in `decisions.md` after testing the cookie in practice.


### Task 3

Added a custom `X-Request-Id` response header and verified that it was returned by the API.

Also added a custom `X-Client-Id` request header in Postman and read it from the incoming request using `req.get()`.

A frontend running on a different origin cannot normally read custom response headers because of the browser's CORS restrictions. The `Access-Control-Expose-Headers` response header allows specific custom response headers to be exposed to frontend JavaScript.


### Task 4

Tested redirects using both `301` and `302`.

* **301:** `/catalogue` redirected to `/books`. After changing the target to `/users`, the browser still redirected to `/books` because it had cached the permanent redirect. The new server code did not run for the redirect.
* **302:** `/catalogue-302` redirected to `/books`. After changing the target to `/users`, the browser followed the new `/users` target because the redirect was temporary and was not permanently cached.

**Practical rule:** Use `301` when a resource has permanently moved and `302` when the redirect is temporary.

To undo a `301` that had already been shipped to 400 members, the cached redirect would need to be dealt with on affected clients, since changing the server-side target alone may not take effect immediately.

The two method-preserving redirect codes are `307` and `308`. `307` is the temporary version and `308` is the permanent version; they matter when redirecting requests such as `POST`, `PUT`, or `PATCH` where the HTTP method and request body need to be preserved.


### Task 5

Built a redirect loop where `/a` redirects to `/b` and `/b` redirects back to `/a`.

When visiting `/a` in Chrome, the browser followed the redirect loop and made **20 requests**. The requests before the final one returned `302`, and the 20th request failed with `ERR_TOO_MANY_REDIRECTS`.

A naive Node.js Axios client also followed the redirects automatically. It eventually stopped with `ERR_FR_TOO_MANY_REDIRECTS: Maximum number of redirects exceeded`. The Axios configuration showed a default `maxRedirects` value of `21`.

To protect the client from redirect loops, I would set a lower `maxRedirects` limit so the client stops following redirects after a small number of attempts.


# Exercise 4

### Task 1

Split the Express application from the server startup by keeping the app and middleware in `app.js` and moving `app.listen()` into `server.js`. The seed data is loaded once when the application starts and stored in `app.locals.db`, instead of being loaded for each request. Added nodemon and updated the `npm run dev` script to start `server.js`.

This separation is useful for testing because `app.js` can be imported directly into tests without opening a network port.


### Task 2

Updated the Week 1 Postman environment to point to the local server at `http://localhost:3000` and ran the complete collection against the Express API before making any changes.

The initial test run had:

* **Total tests:** 37
* **Passed:** 18
* **Failed:** 19


### Task 3

Classified the initial 19 failures into the following piles:

**Server Wrong**

* `POST /api/v1/books` — missing request body caused the controller to crash.
* `PATCH /api/v1/books/:id` — missing request body caused the controller to crash.
* `POST /api/v1/users` — missing request body caused the controller to crash.
* `PATCH /api/v1/users/:id` — missing request body caused the controller to crash.
* `POST /api/v1/auth/login` — missing request body caused the controller to crash.
* `POST /api/v1/borrow-requests` — missing request body caused the controller to crash.
* `PATCH /api/v1/borrow-requests/:id` — missing request body caused the controller to crash.

**Collection Wrong**

* Book, user, and borrow-request requests used numeric IDs such as `12` and `1`, while the actual API uses IDs such as `bk-1`, `m-1000`, and `br-100`.
* `POST /api/v1/books` had no request body and later had an incorrect response assertion for the nested `data.id`.
* `GET /api/v1/users/:id` had an assertion expecting the numeric ID `1` instead of the actual string ID `m-1000`.
* `POST /api/v1/users` had no request body.
* `POST /api/v1/borrow-requests` had no request body.
* The login request had no credentials in its request body.

**Spec Wrong**

* No genuine specification mismatch was identified from these failures.

After fixing the server and collection issues, I restarted the server to reload the seed data and ran the complete collection again. The final run passed **37/37 tests with 0 failures**.


### Task 5

If I were writing the Week 1 specification today, I would define the response shapes, status codes, and validation rules more clearly and consistently from the start.
I got the API versioning, resource-based routes, and error response structure right, even though I was not fully sure about them at the time.
I am most concerned about keeping the API dependent on in-memory data and how the current update/delete behaviour will translate when a real database is introduced next week.
