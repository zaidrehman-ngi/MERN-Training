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

# Exercise 4 — Choosing an ORM

## Task 3: Which ORM for the capstone

I'm going with **Prisma**.

Reasons:

1. The error messages. When I get a field name or a relation wrong it
   tells me before the query runs, and the database errors have codes I
   can look up. As a trainee that saves me a lot of time.
2. Migrations are generated from `schema.prisma` as SQL files I can read,
   and they can run from an empty database, which is what the hand-in
   needs. With Sequelize I'd be writing every migration by hand.

What I'm giving up: control over the SQL. Prisma writes the queries for me
and they're not always the same as what I would write. Some things, like
the days overdue calculation, can't be done in a normal Prisma query, so
for those I'll need `$queryRaw` and plain SQL. Drizzle would have let me
keep the queries close to the SQL I wrote this week.

**What would it cost to change this in Week 8?**

The database itself wouldn't change. The tables, data and indexes stay the
same whichever ORM I use, and the migrations are just SQL. What would need
redoing is the ORM schema file and every query in the repositories, plus
testing all the routes again. If all the database code stays in the
repository files (like the JSON repositories now) and the routes and
services only call those, it's a few days of work, mostly rewriting the
queries in the repositories. If Prisma calls end up all over the
controllers, it gets a lot harder.

So I don't think I need to worry much about which ORM I pick. The
important part is keeping all the database code in one layer, because
that's what makes changing it later cheap or expensive.
