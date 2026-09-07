# Exercise 1

### Task 6 — JWT Storage Decision

I would store the JWT in an `httpOnly` cookie.

Using `localStorage` exposes the token to JavaScript, so an XSS vulnerability could allow an attacker to steal the token.

An `httpOnly` cookie prevents JavaScript from directly reading the token, reducing the risk of token theft through XSS. However, because the browser automatically sends cookies with requests, CSRF is the main attack to defend against, using protections such as `SameSite` cookies and CSRF tokens where needed.

Decision: Use an `httpOnly`, `Secure`, `SameSite` cookie with appropriate CSRF protection.


# Exercise 3

### PART B - Task 6a - Public WiFi Problem

I would use a combination of account/email and IP address for login rate limiting instead of relying only on one key. This helps reduce the impact of attackers while avoiding completely blocking all users sharing the same public IP.

However, this is not a perfect solution. Multiple members can still share the same IP on public WiFi, and an attacker can also change IP addresses. Rate limiting alone cannot reliably identify whether a request is from a real member or an attacker.


### PART B - Task 6b - Failed Login Attempts

I would slow down or temporarily rate-limit the login attempts instead of permanently locking the account after five failed attempts.

If an attacker knows a member's email address, they could intentionally enter wrong passwords five times and permanently lock that member's account. This could be used to deny access to other members. Slowing down the login attempts makes password guessing harder without allowing an attacker to permanently lock someone else's account.
