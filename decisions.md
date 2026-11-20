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

---

# The ten decisions that shaped the library system

1. **Database: PostgreSQL, not MongoDB.** The data is relational: members
   borrow books, and a loan must point to a member and a book that really
   exist. Foreign keys check that for me, and reports like overdue loans
   are simple joins. The cost is that changing a table needs a migration.

2. **ORM: Prisma, not Sequelize or Drizzle.** It writes migrations as SQL
   files I can read and run on an empty database, its client is typed,
   and its errors are clear. I gave up control over the SQL, so a few
   queries use `$queryRaw`. All database code is in the repositories, so
   changing the ORM would only touch that layer.

3. **IDs: generated UUIDs, not ISBN.** Some books have no ISBN and a new
   edition gets a new one. ISBN stays as a unique value among active
   books.

4. **Deleting: soft delete, not hard delete.** Members and books get
   `is_active = false`, so loan history and fines stay. Partial unique
   indexes let a closed member's email or an old ISBN be used again.

5. **Cascades: none on history.** Foreign keys from loans, tokens and
   notifications don't cascade. Removing a member must never wipe their
   loans or what they owe, and since nothing is hard-deleted, there is
   nothing to cascade.

6. **Tokens: access token in memory, refresh token in an httpOnly
   cookie.** Not `localStorage`, which any script can read, and not the
   access token in a cookie, which would need CSRF protection on every
   write. On a reload the app gets a new access token from the cookie. In
   production login and refresh go through the frontend's own domain, so
   the cookie isn't blocked as a third-party cookie.

7. **State: Redux Toolkit, not only Context.** The current user comes from
   the server, has a status, and is changed from outside React (the Axios
   interceptor ends the session). Socket events and HTTP responses for
   the same books also need one place to land. Search, filter and page
   stay in the URL.

8. **Styling: CSS Modules with a shared `tokens.css`, not styled-components
   or Tailwind.** Styles stay in their own files, are scoped to the
   component, and need nothing at runtime. I gave up styling by props.

9. **Backend structure: Express with routes, controllers, services and
   repositories wired by hand, not NestJS.** Services get their
   repositories passed in, so the rules are tested with fakes and no
   database. For one developer and about 25 endpoints Express is enough;
   for a large team I'd pick Nest.

10. **Fines: computed while the book is out, stored when it comes back,
    not updated by a nightly job.** The amount shown is always current and
    no hidden job changes it. The stored fine at return is a record, so a
    later rate change doesn't rewrite old fines.
