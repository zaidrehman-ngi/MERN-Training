# Exercise 1

### Task 2

**What gets logged:**
A and B will be logged. C and D will not run because B does not call `next()`.

**What the client receives:**
The request will keep waiting and eventually time out because no middleware sends a response.

**What appears in the error output:**
I expect no Express error because the request is simply stuck and no error is thrown.

**How I would recognise this in a real codebase:**
I would notice that the request hangs without a response or error, then check the middleware chain and look for a middleware that does not call `next()` or send a response.


# Exercise 2

### Task 3

**Prediction:** The unauthenticated request will reach `approveHandler` because the route is registered before `requireAuth`. The authentication middleware will not run for that route, so the request will be approved without a token.


# Exercise 3

### Task 3

* **Does the request reach the Express server?** Yes, I think the request still reaches the Express server on port 3000.
* **Does the route handler run?** Yes, I think the route handler runs and the server processes the request.
* **Does the database change if it is a POST?** Yes, I think a POST request can still change the database because the server receives and processes it.
* **What exactly fails?** I think the browser blocks the frontend from accessing the response because the API does not allow the frontend's origin through CORS.
