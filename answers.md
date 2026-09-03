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


