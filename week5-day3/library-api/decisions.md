# Exercise 4

### Task 4

I would hand-roll file serving when the application needs custom behavior that `express.static` does not provide, such as checking database-based permissions before serving a private file or generating/streaming a file dynamically.

When hand-rolling file serving, I would need to correctly handle path resolution and traversal protection, authorization, content types, streaming, and file/error handling. The extra control comes with more security and implementation responsibility.
