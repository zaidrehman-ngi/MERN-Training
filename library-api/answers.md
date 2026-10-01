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
