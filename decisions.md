# Exercise 2 — Login, for real this time

## Task 2: Where the tokens live

In Week 1 I said the JWT should go in an `httpOnly` cookie. In Week 5 only
the refresh token went in a cookie, and the frontend kept the access token
in `sessionStorage`.

Final decision:

- Access token (15 min): in memory only, sent as `Authorization: Bearer`.
- Refresh token (7 days): `httpOnly`, `SameSite=Strict` cookie, only sent
  to `/api/v1/auth`.
- On page load the app calls `/auth/refresh` to get a new access token, so
  a reload doesn't log the user out.

What changed my mind about putting the access token in a cookie: a cookie
goes with every request, so every write route would need CSRF protection.
A header is only sent when my code adds it. And `sessionStorage` could be
read by any script, while a token in memory is gone in 15 minutes.

Downside: if the frontend and API are on different sites in production,
`SameSite=Strict` will block the refresh cookie and I'll have to change it.
