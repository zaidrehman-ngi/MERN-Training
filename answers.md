# Exercise 1

### Task 1

Tested the API endpoints from the browser:

* `GET /books` → **200**
* `GET /books/bk-3` → **200**
* `GET /books/bk-999` → **404**
* `GET /books?status=overdue` → **200**
* `GET /books?q=karachi` → **200**
* `GET /books?_page=2&_limit=20` → **200**
* Pagination total is provided in the `X-Total-Count` header → **159**


### Task 2

Created a shared Axios client in `src/api/client.js` with the base URL, timeout, and default headers, and added `books.js` with functions for listing, getting, creating, updating, and removing books.

Keeping Axios inside the API modules means that when the base URL or authentication headers change in Week 8, I can update them in one place instead of changing every component and slice.


### Task 3

The Axios request rejected as predicted, and the 404 status was available through `error.response.status`.

The browser's built-in `fetch` behaves differently: a 404 still resolves the Promise, but `response.ok` is `false` and `response.status` is `404`.

I prefer Axios's behaviour because HTTP errors such as 404 automatically reach the `catch` block, making error handling more straightforward.


### Task 4

The request interceptor logs the HTTP method and URL before each request is sent. The response interceptor converts failed requests into a consistent error shape containing a status, a member-friendly message, and the original error for debugging.

In Week 8, I can add **authentication token injection** and **401/expired-token handling** to these interceptors, so they do not have to be repeated in every API call.


### Task 5

Replaced the mock API with real HTTP API calls across the catalogue, book detail page, users list, and borrow requests list. The `mockApi.js` file was deleted, and active components/hooks now use the API modules.

The book filter and search run **server-side** using query parameters:

* `status` for filtering
* `q` for search

I chose server-side filtering and search because it avoids fetching all books and filtering them on the client, and it matches how a real API would handle larger datasets.


### Task 6

Compared the actual JSON Server API with the Week 1 Day 3 API specification.

#### Paths

* Spec uses `/api/v1/books`, `/api/v1/users`, and `/api/v1/borrow-requests`.
* Actual server uses `/books`, `/users`, and `/borrowRequests`.
* The actual server does not use the `/api/v1` prefix, and `borrowRequests` does not follow the spec's kebab-case path.

**Decision:** Keep the Week 1 spec and change the server later. The `/api/v1` versioning and kebab-case convention are better for the real backend, and the frontend can use the proper API structure when the backend is built.

#### Query parameters

The books list query parameters also differ:

| Spec        | Actual server            |
| ----------- | ------------------------ |
| `author`    | `author`                 |
| `title`     | `title`                  |
| `available` | no equivalent documented |
| `sort`      | `_sort`                  |
| `order`     | `_order`                 |
| `page`      | `_page`                  |
| `limit`     | `_limit`                 |

The actual server also supports `status`, `q`, and `title_like`, which were not part of the Week 1 books query specification.

**Decision:** Keep the Week 1 spec and change the server later. The real backend should follow the API contract rather than exposing JSON Server-specific query parameter names.

#### Methods and status codes

The main CRUD methods match the spec: `GET`, `POST`, `PATCH`, `PUT`, and `DELETE` are supported by the actual server where applicable. The actual server returns `404` for a missing resource, `201` for creation, and `200` for successful updates and deletes.

The Week 1 spec did not define the successful response status codes in detail, but its conventions for `400`, `422`, and `409` error responses are not implemented by JSON Server.

**Decision:** Keep these status-code rules in the spec and implement them in the real backend later.

#### Response shapes

The actual server returns the resource data directly as JSON arrays or objects, while the Week 1 spec defines a structured error response containing `error`, `message`, and `details`.

JSON Server does not implement the Week 1 error structure or the authentication-related error responses.

**Decision:** Keep the Week 1 error response contract and implement it in the real backend later.

Overall, the JSON Server API is a temporary implementation for the frontend milestone. The Week 1 specification will be used as the contract for the real backend rather than changing the specification to match JSON Server's conventions.


# Exercise 2

### Task 4

Added `createBookThunk`, `updateBookThunk`, and `deleteBookThunk` using the existing API functions. Each thunk updates the Redux store after a successful request.

The existing Add a Book form was also updated to handle asynchronous submission. `useForm` now tracks `isSubmitting` and `submitError`, disables the submit button while the request is in progress, and shows a user-friendly error if the API request fails.

This gap did not appear last week because form submission was instant and did not involve a network request that could fail or take time to complete.


### Task 5

Reproduced the race condition by triggering multiple book requests quickly. A slower earlier request could finish after a newer request and overwrite the latest results.

Fixed it using Redux Toolkit's `requestId`. The slice stores the latest request ID and only accepts a fulfilled or rejected result if its request ID matches the current one.

The abandoned request is not cancelled. It can still finish in the background, but its result is ignored so stale data cannot update the store.


### Task 6

The three mechanisms handle stale requests differently:

* **Effect cleanup:** stops the previous effect from updating the state after it is no longer relevant. The request itself usually continues in the background.
* **Abort signal:** actually cancels the in-flight request when the underlying API supports cancellation, so the request does not need to continue.
* **Ignoring the response:** lets the request finish, but checks whether it is still the latest request before updating the store. If it is stale, the response is ignored.

In the current code, **ignoring the response with Redux Toolkit's `requestId` is being used**. The older request can still finish, but its result is ignored when its `requestId` no longer matches the latest request.

This shows why loading is not simply a boolean: multiple requests can be in progress, and the application needs to know which request is currently relevant.
