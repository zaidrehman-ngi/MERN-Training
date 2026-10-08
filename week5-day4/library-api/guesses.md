# Exercise 1

### Task 2

1. **Validation:** I expect the validation to fail because `copies` is provided as a string `"3"` instead of a number, and the schema expects a positive integer.

2. **Copies after validation:** I expect `copies` to remain `"3"` because the schema does not use coercion to convert the string into a number.

3. **If the handler stores `req.body`:** I expect the stored object to still contain `title`, `copies`, `role`, and `id`, because `req.body` contains the original unvalidated request body.


# Exercise 2

### Task 3 — Predictions

1. `/a`: I think the error handler will receive the string `"a plain string"`. The client will get a 500, and the server will stay running.
2. `/b`: I think the error handler will receive the `Error` with message `"boom"`. The client will get a 500, and the server will stay running.
3. `/c`: I think the error handler will not receive the rejected promise. The client will get a 200, then the server may stop.
