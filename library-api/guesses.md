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
