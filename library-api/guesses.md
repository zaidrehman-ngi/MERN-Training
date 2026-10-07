# Exercise 1

### Task 2

1. **Validation:** I expect the validation to fail because `copies` is provided as a string `"3"` instead of a number, and the schema expects a positive integer.

2. **Copies after validation:** I expect `copies` to remain `"3"` because the schema does not use coercion to convert the string into a number.

3. **If the handler stores `req.body`:** I expect the stored object to still contain `title`, `copies`, `role`, and `id`, because `req.body` contains the original unvalidated request body.
