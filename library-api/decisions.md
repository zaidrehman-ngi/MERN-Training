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

# Exercise 7 — Registration, done properly

## Task 4: What to say when the email is already registered

**Option 1: tell them the email is taken (409).**
It's the friendliest. Someone who forgot they already signed up finds out
straight away and goes to log in instead. It's also simpler and easier to
debug. The problem is that anyone can type any email into the register form
and find out if that person is a member of the library. For a library
that's not the worst leak, but it's still personal information, it gives
an attacker a list of real accounts to try passwords on, and it can be done
automatically for thousands of emails.

**Option 2: return the same success either way.**
Nobody can tell from the response if an email has an account. The cost is
that a real person who already has an account gets "registration received"
and might be confused about why they can't log in with the new password.
Done properly it needs email: the new person gets a "welcome" email and the
existing owner gets a "someone tried to register with your email, did you
forget your password?" email. I don't have email sending yet.

**My decision: option 2.** Registration returns the same 201 and the same
message whether the email was new or already registered. If it was taken,
nothing is saved. It also hashes the password in both cases so the response
takes the same time, otherwise the timing would give it away. Once there is
email sending, the existing owner should get a message about it.

**Is it consistent with the login decision?** In Week 1 (Day 3) I decided
login should say "Invalid email or password" for both a wrong email and a
wrong password, so it doesn't reveal whether an account exists. Before this
task the two disagreed: login hid it, but register said "A user with this
email already exists", so hiding it at login was pointless. Register was
the wrong one, so I changed it.

While checking I found login was also leaking it a different way. The
message was the same, but an email that didn't exist came back in about
4 ms (no hash to check) and a real one in about 240 ms (bcrypt running).
So login now checks the password against a dummy hash when the email
doesn't exist, and both take about 240 ms. Now both endpoints really do
what the Week 1 decision says.

# Exercise 8 — Login and the token

## Task 2: Load the member on every request, or trust the token?

**Trusting the token's claims.** The token is signed, so nobody can change
the role in it without the secret. Checking it needs no database at all,
so it's fast, the auth part keeps working even if the database is slow, and
it scales easily to more servers. The problem is that the token is a copy
of what was true when it was issued. If an admin is demoted, or a member is
deleted or banned, their old token still says what it said for up to the
whole expiry time (1 hour for me), and there's nothing I can do about it
except wait or change the secret, which logs out everyone.

**Loading the member every time.** The database is the real answer, so a
role change or a deleted account counts on the very next request. I tested
it: after changing Sara to admin in the database, her old token got 200 on
`GET /users`, and after changing her back it got 403 again. A token signed
with the right secret that claims `role: admin` still got 403, because the
database said `user`. After her account was soft deleted, her token got 401
straight away. The cost is one more query on every protected request and
the auth now depends on the database being up.

**My decision: load the member every time.** For this library the cost is
tiny: it's one query on the primary key that only selects the id, name and
role, and I measured it at about 1 to 2 ms per request. Being able to remove
someone's access straight away matters more here, for example a librarian
who leaves or a member who is banned. The token is now only used to say who
the member is, and the database says what they're allowed to do.

If the API got much busier, I'd keep the same idea but cache the member for
a short time, or keep the database check for the risky routes (admin,
deleting, changing other people) and trust the token for read-only ones,
together with a shorter token expiry.
