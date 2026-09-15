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

# Exercise 4

## Part A

### Task 1 — Install bcrypt

`bcrypt` is a dependency because it is required by the application at runtime for password hashing and verification. It needs to be available in the production environment, so it should not be a devDependency.


### Task 2 — Hashing the Password

My guess: The two hashes will be identical because the same password should produce the same hash for login verification.

Actual result: The two hashes were different even though the password was the same. This happens because bcrypt generates a new random salt each time the password is hashed.


### Task 3 — Hash Breakdown

Hash:

$2b$12$ZD0qdvpmbeA.KwTae2l4JubgCBXPovlQKSAJTE8lAZAPJ68YdLhLG

| Part | Value |
|------|-------|
| Algorithm/version | 2b |
| Cost | 12 |
| Salt | ZD0qdvpmbeA.KwTae2l4Ju |
| Digest | bgCBXPovlQKSAJTE8lAZAPJ68YdLhLG |

The salt is stored in plain sight because it is not meant to be secret. Its purpose is to make the same password produce different hashes and prevent attackers from effectively using precomputed password tables. During login, bcrypt uses the stored salt to verify the password.


### Task 4 — Password Verification

The correct password returned `true`, while the wrong password returned `false`.

No decryption was needed because bcrypt is a one-way hashing algorithm; it verifies the password by comparing it with the stored hash instead of recovering the original password.


### Task 5 — Same Password for Different Members

The two members used the same password, but their stored hashes did not match because bcrypt generated a different random salt for each hash.

This helps defeat rainbow table and precomputed hash attacks. If the hashes had matched, an attacker with 40,000 rows could identify users with the same password and use precomputed password hashes to quickly find common passwords across many accounts.


### Task 6 — Cost Factor Timing

| Cost factor | Time |
|-------------|------|
| 8 | 14.76 ms |
| 10 | 61.98 ms |
| 12 | 231.65 ms |
| 14 | 1016.54 ms |

I would ship cost 12 because it provides a good balance between password security and login performance. Cost 14 takes about 1.02 seconds per hash on my system, which becomes expensive at high login volume.

At 500 logins per minute, cost 14 would require about 508 seconds, or 8.47 minutes, of sequential hashing work. The exact server impact depends on how many requests can be processed in parallel and the available CPU resources. It becomes unacceptable when hashing consumes enough CPU that normal requests become slow or the server cannot handle the expected login traffic.


## PART B

### Task 8 — AES-256-GCM Encryption

The same phone number was encrypted twice, and the two ciphertexts were different because a new random IV was generated for each encryption.

Reusing an IV with the same AES-GCM key can break the security of the encryption and authentication. IVs should therefore be unique for each encryption.

This is similar to the salt behavior in bcrypt because the same input does not produce the same output. However, they have different purposes. A bcrypt salt protects password hashes from precomputed and rainbow table attacks, while a GCM IV ensures that each encryption is unique and maintains the security of the encryption and authentication.


### Task 10 — Tampering Detection

I flipped a single byte of the ciphertext and tried to decrypt it. GCM detected that the ciphertext had been changed because the authentication tag no longer matched, so decryption failed with an authentication error.

A mode without an authentication tag might have accepted the modified ciphertext and returned altered plaintext to the application without detecting the tampering. The application could then process corrupted or manipulated data as if it were valid.

This shows why AES-GCM provides both encryption and authentication.


### Task 11 — Key Management

The real encryption key is stored in the `.env` file, which is excluded from Git using `.gitignore`. The `.env.example` file contains only a placeholder and does not contain the real key.

The key can be read by the application running on the server and by authorized people who have access to the server's environment or secret configuration. It should not be committed to the repository or shared with developers who do not need access to it.

The partner library made a critical mistake by storing the encryption key in `config.js` inside the repository. Once the attacker cloned the repository and obtained the database dump, they had both the encrypted data and the key needed to decrypt it.


## PART C

### Task 13 — What to Store and How

| Field | Decision | Algorithm / Key Location | Reason |
|---|---|---|---|
| Member password | Hash | bcrypt | The password only needs to be verified during login, so it should not be recoverable. |
| JWT signing secret | Do not store | Keep it in an environment variable or secret manager | The signing secret is a server secret and should not be stored in the database. |
| Member phone number | Encrypt | AES-256-GCM; key stored in an environment variable or secret manager | The application needs to read the phone number, so it must be reversible but the data should remain protected. |
| Password-reset token held server-side | Hash | bcrypt | The server only needs to check whether the supplied token matches, so the original token does not need to be recoverable. |
| CNIC captured at registration | Encrypt | AES-256-GCM; key stored in an environment variable or secret manager | The CNIC is sensitive data and may need to be read back, so it should be encrypted with the key kept outside the database. |
| Book ISBN | Store as plain text | None | ISBNs are identifiers rather than secrets, and the application needs to search and display them. |


### Task 14

#### Why is salted SHA-256 wrong for passwords?

Salted SHA-256 is still too fast for password storage. Even with a unique salt, an attacker with a database dump can test a very large number of password guesses quickly. Passwords should use a slow, password-specific hashing algorithm such as bcrypt, which makes offline guessing much more expensive.

#### Why is encrypting passwords a design error?

Passwords should not be encrypted because the application does not need to recover the original password; it only needs to verify it. Encryption is reversible, so anyone who gains access to the encryption key can recover all passwords. The partner library's mistake was using reversible encryption for passwords instead of one-way password hashing, even if the key had been stored securely outside the repository.


### Task 15 — Hashed Phone Numbers

I would tell the developer: Phone numbers should have been encrypted with AES-256-GCM because the application needs to read the original number back.

The already hashed phone-number column cannot be decrypted because hashing is one-way. We need to recover the phone numbers from another trusted source or ask members to provide and verify their phone numbers again, then encrypt and store them correctly.