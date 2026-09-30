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
