# Exercise 2

## Part A

| Family | Meaning | Rule |
|--------|---------|------|
| 1xx | Informational | The request was received and the server is providing preliminary information. |
| 2xx | Success | The request was successfully received, understood, and processed. |
| 3xx | Redirection | The client needs to take further action or use a different resource or location. |
| 4xx | Client Error | The request has a problem on the client side, such as invalid data or missing authentication. |
| 5xx | Server Error | The server failed to process the request because of a server-side problem. |

A 4xx error means the request or client side should be checked first. A 5xx error means the server side should be checked first.


| # | Scenario | My Answer | Actual Answer |
|---|----------|-----------|---------------|
| 1 | Book list returned successfully | 200 | 200 |
| 2 | Book created successfully | 201 | 201 |
| 3 | Book updated successfully | 200 | 200 |
| 4 | Book deleted successfully, nothing to say | 204 | 204 |
| 5 | Book ID does not exist | 404 | 404 |
| 6 | ISBN is missing from request body | 400 | 400 |
| 7 | ISBN is present but not a valid ISBN | 400 | 422 |
| 8 | ISBN already belongs to another book | 409 | 409 |
| 9 | No token sent at all | 401 | 401 |
| 10 | Token sent, but expired | 401 | 401 |
| 11 | Valid token, but a user is hitting an admin-only endpoint | 403 | 403 |
| 12 | Database is down | 500 | 500 |

Result: 11/12 correct. Only #7 was incorrect. I answered 400, but the expected status code is 422 because the request structure is valid, while the ISBN value itself fails validation.


## Part B

#### 401 vs 403

401 Unauthorized: The user is not authenticated, such as when the token is missing or expired.

Library scenario: A user tries to access their borrow requests without sending a valid authentication token.

403 Forbidden: The user is authenticated, but does not have permission to perform the requested action.

Library scenario: A regular user tries to delete a book, but only a librarian or admin can perform that action.

Hard case: If a user calls the endpoint to approve their own borrow request, the response should be 403 Forbidden because the user is authenticated but does not have permission to approve borrow requests. This action is restricted to librarians or admins.

There is an argument for 404 Not Found if the system intentionally hides the existence of the resource from unauthorized users. This can prevent users from discovering resources they should not have access to. However, for this Library System, 403 is clearer because the borrow request exists and the user is authenticated but lacks permission.


#### 400 vs 422 vs 409

400 Bad Request: The request is missing a required field, such as an ISBN.
422 Unprocessable Content: The request is valid, but the provided ISBN is not in a valid format.
409 Conflict: The ISBN is valid, but it already belongs to another book.

For 400, 422 would be wrong because a required field is missing, while 409 would be wrong because there is no conflict with an existing resource.

For 422, 400 would be wrong because the request structure is valid, while 409 would be wrong because the ISBN does not conflict with another book.

For 409, 400 would be wrong because the request is properly formed, while 422 would be wrong because the ISBN itself is valid but conflicts with an existing book.


#### Successful POST /books

A successful POST /books should return 201 Created.

The response should include a Location header containing the URL of the newly created book, such as /api/v1/books/12.

The body should contain the whole created book. This allows the frontend to immediately display or update the new book without making another GET request.


## PART C

#### Login Failure

I will use the same message for both cases: "Invalid email or password."

This is safer because it does not reveal whether an account exists. The trade-off is that it is less friendly because a genuine user does not know whether the email or password was incorrect.

For the password reset screen, I would use the same approach. The system should not reveal whether an account exists, so the response can say that if the email is registered, reset instructions will be sent.


#### Unexpected Server Error

The raw database error should not be returned because it can expose sensitive system details; instead, return a generic 500 error message to the client and log the full error securely on the server for debugging.

==================================================================================================

# Exercise 3

## PART A

| Method | Safe? | Idempotent? |
|--------|-------|-------------|
| GET | Yes | Yes |
| POST | No | No |
| PUT | No | Yes |
| PATCH | No | Yes |
| DELETE | No | Yes |

Safe: A method is safe when it is intended only to retrieve information and does not change the server's data.

Idempotent: A method is idempotent when making the same request multiple times has the same effect on the server's data as making it once.


#### Triple Borrow

POST caused the triple borrow because each POST request creates a new borrow request. When the first request did not get a response due to the unstable network, the app retried it, resulting in three separate borrow requests.

This is inherent to POST because repeated requests can create multiple resources. The retry was the correct behavior for the mobile app because the user should not have to tap Borrow repeatedly when the network is slow or unreliable.


#### Idempotency Key

The client will generate a unique key for each borrow action and send it in the Idempotency-Key header.

On the first request, the server creates the borrow request and returns 201 Created.

If the same request is sent again with the same key, the server will not create another borrow request. It will return the result of the original request with 201 Created.

If two different members send the same key, the server will reject the second request because each key must be unique to one user action.


#### DELETE Idempotency

DELETE is still idempotent even if the first and second responses are different.

The first DELETE /books/12 may return 204 because the book was deleted. The second call may return 404 because the book no longer exists.

Idempotency promises that the server state is the same after one or multiple identical requests. It does not promise that the response will be the same.


#### PUT vs PATCH

PUT /api/v1/books/12
{
  "title": "Dune",
  "author": "Frank Herbert",
  "copiesOnShelf": 4
}

PATCH /api/v1/books/12
{
  "copiesOnShelf": 4
}

PUT replaces the whole book resource, so the complete book data must be provided. If the PUT body only contains copiesOnShelf, title and author will be removed or reset because they were not included in the replacement.

PATCH is used when only specific fields need to be changed.

Convention: PUT requests must include the complete book representation, while PATCH requests may include only the fields that need to be changed.


## PART B

#### API Versioning

Path: The version is included in the URL, such as /api/v1/books.

Header: The client sends the API version in a request header.

Query parameter: The version is included as a query parameter, such as /api/books?version=1.

Media type: The version is specified in the Accept header using a versioned media type.

Chosen approach: I will use path-based versioning, such as /api/v1/books, because it is clear, easy to test, and makes the API version visible in the URL.


#### Breaking vs Non-Breaking Changes

| # | Change | My Answer | Reason |
|---|--------|-----------|--------|
| 1 | Renaming availableCopies to copiesOnShelf | Breaking | Existing clients using availableCopies will stop working. |
| 2 | Adding a coverImageUrl field to the book response | Non-breaking | Existing clients can ignore the new response field. |
| 3 | Making an optional request field required | Breaking | Existing clients that do not send the field will start getting errors. |
| 4 | Changing status from 1 / 2 / 3 to "pending" / "approved" / "rejected" | Breaking | Existing clients expecting numeric values will no longer understand the response. |
| 5 | Adding a new possible status value | Non-breaking* | Existing clients can continue working if they do not assume the status list is fixed. |
| 6 | Removing an endpoint nobody has called in six months | Breaking* | If any old client still calls the endpoint, it will receive an error and stop working. |
| 7 | Making /books paginated by default when it used to return everything | Non-breaking | The app will receive a limited number of books instead of all books, but it will not necessarily break or produce an error. |

*Argued cases:
- #5 is argued because a client that assumes only the existing status values can break when a new status value appears.
- #6 is argued because even if the endpoint has not been called for six months, there could still be an old or rarely used client that calls it later and gets an error.


#### V1 Deprecation Plan

V1 and V2 will run at the same time so members are not forced to update immediately.

V1 will stay supported for 6 months after V2 is released. The final date will depend on usage data. If significant users are still using V1 near the deadline, the date can be extended.

We will use API logs and analytics to find out which clients are still calling V1 endpoints.

While V1 is still being served, its responses will include Deprecation and Sunset headers to tell clients that V1 is deprecated and when it is planned to be removed.


#### Project Manager Reply

Assuming we need to rename the 'availableCopies' field to 'copiesOnShelf':

The rename is not a five-minute change because the old field name may already be used by the mobile app and other parts of the system. If we simply rename it, older versions of the app may stop working when they receive a response they do not expect. I recommend releasing this change as V2 instead of changing V1 directly. V1 and V2 should run at the same time so members using an older version of the app can continue using the library without being forced to update immediately. We should keep V1 running for 6 months after V2 is released. The final removal date should also depend on usage data. If a significant number of members are still using V1 near the deadline, we can extend the support period. We need the mobile team to tell us which app versions are currently in use and when they expect their users to move to V2. We should also track our API logs to see which clients are still making requests to V1. While V1 is still available, we should clearly tell older clients that it is being phased out and provide the planned removal date. This gives the mobile team enough time to update the app and move users to V2 without breaking their experience.

================================================================================

