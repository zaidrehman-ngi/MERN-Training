# Exercise 1

### Task 3

I predict that an Axios request to `/books/bk-999` will **reject** because the server returns a 404. The 404 status should be available in the Axios error object, likely through `error.response.status`.
