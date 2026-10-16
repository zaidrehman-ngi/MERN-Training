# Exercise 3 — Count, group, having

## Task 5: Where should the available-copy count live?

There are three places this logic could go:

- **Trigger:** the database updates `available_copies` itself whenever a
  loan is inserted or returned.
- **Service layer:** the API code updates the count in the same
  transaction where it creates or returns the loan.
- **Computed on read:** don't store a count at all; count the
  in-collection copies with no open loan whenever we need it.

**Advantage of the trigger:** it can't be skipped. It runs no matter where
the loan comes from: the API, a script, a seed file, or someone typing an
`INSERT` in DBeaver like I did in the test. With the service-layer version,
anything that writes to `borrow_requests` without going through the API
leaves the count wrong.

**Danger of the trigger:** it is invisible from the API code. A year from
now, a developer reading the loan service will see an `INSERT` into
`borrow_requests` and nothing else. They won't know `books` is being
updated too, so if the count looks wrong, or they add their own code to
update it, they could end up counting every loan twice and have no idea
why. Nothing in `src/` points to the trigger.

**My decision:** compute it on read for now. With an index on
`borrow_requests (copy_id)` the count is a quick query, and there is no
stored number that can drift away from the real loans. If it ever gets too
slow, I would move it into the service layer so the logic is visible in the
code, before using a trigger.
