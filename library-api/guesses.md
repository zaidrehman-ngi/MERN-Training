# Exercise 1

### Task 4 — Guess

Given these routes in this order:

```js
router.get("/:id", ...);
router.get("/new", ...);
```

For:

```text
GET /api/v1/books/new
```

I predict that Express will match the `/:id` route first because `new` can be treated as the value of `:id`.

Therefore:

* Matched route: `/:id`
* `req.params.id`: `"new"`
* The `/new` route will not be reached.
* The request will therefore be handled by `getBookById`, which will search for a book with `id === "new"`.
* Since there is no such book, I expect a **404 Book not found** response.
