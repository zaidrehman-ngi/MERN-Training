# Exercise 1

### Task 1

I used `safeParse` because it returns a result object instead of throwing an exception when validation fails. This allows the handler to check the validation result and return the appropriate Week 1 error response to the client.

`parse` throws a Zod error when validation fails, so it would need to be handled with `try/catch`. I would use `parse` when invalid data should immediately throw an error and I am handling that error separately, rather than returning a validation response directly from the handler.


### Task 2

The initial validation failed because `"copies": "3"` was a string while the schema expected a number. After changing the schema to use `z.coerce.number()`, validation passed and `"3"` was converted to `3`.

The handler that saved `req.body` stored all the fields sent by the client, including `role: "admin"` and `id: "bk-1"`.

The handler that saved `result.data` stored only the fields defined in the schema:

```json
{
  "title": "Dune",
  "copies": 3
}
```

This shows why the handler should use the validated result instead of saving `req.body` directly. Saving `req.body` can allow unexpected client-controlled fields such as `role` and `id` to be stored.


### Task 3

I created Zod schemas for the catalogue query parameters and the book ID path parameter. Query parameters such as `page` and `limit` arrive as strings, so `z.coerce.number()` converts them into numbers. Missing `page` and `limit` use sensible defaults of `1` and `10`.

A request such as `?page=banana` returns `400 Bad Request` because the value was provided but cannot be converted into a valid number. This is different from a missing `page`, where using the default value of `1` is appropriate because the client did not provide a value.


### Task 6

The Week 3 form checks email format, an eight-character minimum password, and
matching confirmation. The backend schema checks email format and password
length too, because frontend checks can be bypassed. Confirmation stays on the
frontend: it is not sent to the API.

We could remove frontend validation without making the API unsafe, but users
would lose immediate feedback. Removing backend validation might go unnoticed
in the form, but would leave the API unprotected.
