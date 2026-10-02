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
