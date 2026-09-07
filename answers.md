# Exercise 1

### Task 1 — JWT Anatomy

My guess: I thought the signing secret would be required to read the contents of Token A.

Actual result: The secret was not required. I split the token into its three parts and decoded the header and payload using `atob()`. This showed that the JWT contents are encoded, not encrypted.

A JWT has three parts:

| Part | Description |
|---|---|
| Header | Encoded JSON containing information such as the signing algorithm and token type. |
| Payload | Encoded JSON containing claims such as the user ID, email, role, and expiry. |
| Signature | A cryptographic signature generated using the header, payload, and signing secret. It protects the token from being modified without detection. |

The header and payload are encoded, not encrypted, so anyone who has the token can read them without the secret. The signature is not encryption; it is used to verify the token's integrity and authenticity.


### Task 2 — Sensitive Data in the JWT

Two fields that should never have been included in the JWT are `cnic` and `passwordHash`.

The `cnic` is sensitive personal information and should not be exposed in a readable JWT payload.

The `passwordHash` is also sensitive and should never be placed in a JWT. Although it is hashed with bcrypt, the JWT payload is only encoded, not encrypted, so anyone holding the token can read the hash and potentially perform offline password-guessing attacks.

Someone holding the stolen phone now has the member's CNIC in plaintext and their bcrypt password hash, along with their member ID, email, role, and token validity information.


### Task 4 — Tampering the JWT

I changed the `role` in Token A from `librarian` to `admin` while keeping the original signature.

`jwt.verify()` failed with `invalid signature` because the token payload was modified without creating a new valid signature.

However, `jwt.decode()` still showed `role: 'admin'` because it only decodes the token and does not verify its signature.

A server using `jwt.decode()` for authentication could trust the tampered `role: admin` claim and give the attacker admin privileges.


### Task 5 — Re-signing and Expiration

The JWT signature protects the integrity and authenticity of the token, ensuring that changes to its contents can be detected. If the signing secret leaks, an attacker can create validly signed tokens with modified claims, such as `role: admin`, so the secret must be kept secure and rotated if compromised.

Token B failed verification with `jwt expired` because its `exp` (expiration time) claim had passed.


# Exercise 2

### Task 1 — What Each Party Holds

After a successful Google sign-in:

- Member: Has their Google account and is signed in to the library account.
- Library browser app: Holds the temporary authorization code and later uses the session/token provided by the library.
- Library server: Receives the authorization result from Google and keeps the member's library account/session information.
- Google: Holds the member's Google account and verifies their identity.

The member's Google password is only seen by Google. The library browser app and library server never receive or need the Google password.


### Task 2 — Authorization Code Flow

1. The member clicks “Sign in with Google” on the library website.
2. The library browser app redirects the member to Google's sign-in page.
3. The member signs in to Google, and Google verifies their identity.
4. Google sends a short-lived authorization code back to the library browser.
5. The browser sends this code to the library server.
6. The library server sends the code to Google to exchange it for the required token and user information.
7. Google verifies the code and sends the information back to the library server.
8. The library server identifies the member and signs them into their library account.


### Task 3 — Why the Server Exchanges the Code

The browser should not receive the token directly because anything stored or handled by browser-side JavaScript can potentially be exposed through attacks such as XSS. If an attacker steals the token, they may be able to use it to make authenticated requests as the member.

Instead, the browser receives only a short-lived authorization code, and the library server exchanges that code with Google for the token. This keeps the more sensitive token on the server instead of exposing it to the browser.


### Task 4 — The State Parameter

The `state` parameter is a random value that connects the Google login response to the login request originally started by the member's browser. It prevents login CSRF, where an attacker could send their own Google authorization response to a member. Without `state`, the member could unknowingly be signed into the library using the attacker's Google account.


### Task 5 — OAuth, Login, and Member Records

OAuth 2.0 is used to give an application permission to access something on a user's behalf, while login is about confirming who the user is. For proper login and identity verification, OpenID Connect (OIDC) is used on top of OAuth, so the library needs OIDC for Google sign-in.

Even with Google sign-in, the library still needs its own member record because Google only tells us about the user's Google identity. The library needs to store information such as the member's Google account ID, name, email, membership status, permissions, and borrowing history so it can manage the member within the library system.


### Task 6 — Why Google Sign-In Is Not an Afternoon's Work

The “Sign in with Google” button looks simple, but there is much more happening behind it. Google must first confirm the member’s identity and safely send that information back to our system. We also need to make sure that the response actually belongs to the person who started the login and that temporary information cannot be misused. OAuth gives an application permission to access information, but it does not by itself provide a complete login system. For login, we need OpenID Connect, which adds identity information to OAuth. The library must also create or connect the member’s Google account to its own member record, where we keep things such as membership status, permissions, fines, and borrowing history. Finally, the whole process needs to be tested for security, failed logins, account linking, and expired sessions. So the button itself may take minutes, but building the complete and secure system behind it is why it is not realistically an afternoon’s work.


