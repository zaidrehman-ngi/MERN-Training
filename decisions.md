# Exercise 1

### Task 6 — JWT Storage Decision

I would store the JWT in an `httpOnly` cookie.

Using `localStorage` exposes the token to JavaScript, so an XSS vulnerability could allow an attacker to steal the token.

An `httpOnly` cookie prevents JavaScript from directly reading the token, reducing the risk of token theft through XSS. However, because the browser automatically sends cookies with requests, CSRF is the main attack to defend against, using protections such as `SameSite` cookies and CSRF tokens where needed.

Decision: Use an `httpOnly`, `Secure`, `SameSite` cookie with appropriate CSRF protection.
