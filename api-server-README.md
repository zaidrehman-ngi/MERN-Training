# The library API server — Week 4, Day 3

`db.json` is a real HTTP API for the capstone. Three resources, seeded from the
fixture you have been using since Week 2: **books** (159), **users** (24),
**borrowRequests** (40).

## Running it

Pin the version. Do not install `json-server` without it.

```bash
npm install --save-dev json-server@0.17.4
npx json-server --watch db.json --port 4000 --delay 300
```

`--delay 300` makes every response take 300ms. Leave it on — a loading state
you never see is a loading state you never built. Drop it to 0 when you are
measuring something, and take it to 3000 when you want to watch the UI suffer.

**The version matters.** `json-server@1.x` is a beta with a different query API:
no `q=` full-text search, no `_like`, `_page`/`_per_page` instead of
`_page`/`_limit`, and `POST` ignores any `id` you send and invents its own.
Every tutorial you find is written for 0.17. Install 1.x by accident and half
of Exercise 1 silently returns empty arrays.

## What works

| Need | Request |
|---|---|
| List | `GET /books` |
| One record | `GET /books/bk-3` |
| Missing record | `GET /books/bk-999` → **404** |
| Filter by field | `GET /books?status=overdue` |
| Full-text search | `GET /books?q=karachi` |
| Field contains | `GET /books?title_like=Sindh` |
| Paginate | `GET /books?_page=2&_limit=20` → total in the `X-Total-Count` header |
| Sort | `GET /books?_sort=title&_order=desc` |
| Create | `POST /books` → **201** |
| Partial update | `PATCH /books/bk-3` → 200 |
| Full replace | `PUT /books/bk-3` → 200 |
| Delete | `DELETE /books/bk-3` → 200 |

Compare that table against the endpoint spec you wrote in Week 1, Day 3. It is
close but not identical — the methods and the status codes line up, the query
parameter names probably do not. Exercise 1 asks you what you do about that,
and "quietly change the spec" is one of the two defensible answers.

## Things it will not do

No auth, no validation, no business rules. It will happily let you set
`onShelf` to 400 on a book with 2 copies, approve the same borrow request
twice, or create a book with no title. Every rule that matters lives in the
backend you start building next week — which is precisely why this is a
throwaway and your Week 1 spec is not.
