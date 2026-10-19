# Exercise 1 — Answer the question in SQL

## Task 2: Conditions that combine

Our schema records when a copy was acquired, but not when a book was
published. I used `acquisition_year > 1980` for the Clifton query because
it was the closest field available. It tells us when the copy was acquired,
not when the book was published.

`WHERE ba.author_id = NULL` returned nothing, even though two books have no
author recorded. SQL doesn't treat `NULL` like an ordinary value: that
comparison is `UNKNOWN`, and a `WHERE` clause keeps only rows where the
condition is true. With the `LEFT JOIN`, `ba.author_id IS NULL` finds books
without a matching author row. It returned “Constraint Test Book” and
“Untitled donation, box 14”.

**Rule: never compare to `NULL` with `=` or `<>`; use `IS NULL` or
`IS NOT NULL`.**

## Task 3: Filter and limit in SQL or Node

I guessed that SQL would be faster and send less data. The Node version
fetches all four selected columns for all 400,002 loans; I expected that to
be tens of megabytes. The SQL version should send no more than ten rows,
probably only a few kilobytes.

| Approach | Elapsed time | Rows transferred from PostgreSQL |
|---|---:|---:|
| Fetch all, then filter/sort/slice in Node | 773.706 ms | 400,002 |
| Filter/sort/limit in SQL | 68.721 ms | 1 |

There was only one overdue loan, so SQL sent one row to Node instead of
400,002. In this run, the SQL version took about 69 ms; fetching everything
and then filtering and sorting in Node took about 774 ms. The exact times
will change with cache and system load, but sending one row instead of the
whole table is the bigger lesson.

## Task 4: INSERT, UPDATE, DELETE

I added a temporary book and two copy rows, changed the second copy's
condition note, checked that the book had two copies, and then deleted the
copies and the book. I used its temporary ISBN to target the test rows, so
they were easy to identify and clean up.

I also made a temporary table with three rows and ran
`UPDATE task4_update_test SET label = ...` without a `WHERE` clause.
PostgreSQL reported three affected rows, and a count confirmed all three
had changed. I dropped the temporary table afterward.

On a production database, I would first run a `SELECT` with the condition
I plan to use, then make the change in a transaction. I would check how
many rows changed before committing; if the number looked wrong, I would
roll back. In DBeaver, manual-commit mode lets me choose when to commit or
roll back, and a read-only connection can prevent accidental writes. I
would still check the `WHERE` clause carefully: these safeguards don't
stop a valid `UPDATE` without `WHERE` from changing every row.

## Task 5: Move the catalogue query into SQL

This query takes six parameters: `$1` is the status filter (`all`,
`available`, `out`, or `overdue`), `$2` is the search text, `$3` is the
sort field (`title`, `author`, or `year`), `$4` is the sort direction, and
`$5` and `$6` are the page number and page size. The API should validate
the filter and sort options. The `CASE` expressions choose the sort column
without inserting user-provided text into the SQL.

```sql
WITH catalogue AS (
    SELECT
        b.book_id,
        b.title,
        b.isbn,
        author_data.author_names,
        author_data.first_author,
        copy_data.total_copies,
        copy_data.available_copies,
        copy_data.first_acquired_year
    FROM books AS b
    LEFT JOIN LATERAL (
        SELECT
            STRING_AGG(a.name, ', ' ORDER BY a.name) AS author_names,
            MIN(a.name) AS first_author
        FROM book_authors AS ba
        JOIN authors AS a ON a.author_id = ba.author_id
        WHERE ba.book_id = b.book_id
    ) AS author_data ON TRUE
    LEFT JOIN LATERAL (
        SELECT
            COUNT(*)::INTEGER AS total_copies,
            COUNT(*) FILTER (
                WHERE bc.inventory_status = 'in_collection'
                  AND NOT EXISTS (
                      SELECT 1
                      FROM borrow_requests AS active_loan
                      WHERE active_loan.copy_id = bc.copy_id
                        AND active_loan.returned_on IS NULL
                  )
            )::INTEGER AS available_copies,
            MIN(bc.acquisition_year) AS first_acquired_year
        FROM book_copies AS bc
        WHERE bc.book_id = b.book_id
    ) AS copy_data ON TRUE
),
filtered AS (
    SELECT c.*
    FROM catalogue AS c
    WHERE (
        $1 = 'all'
        OR ($1 = 'available' AND c.available_copies > 0)
        OR (
            $1 = 'out'
            AND EXISTS (
                SELECT 1
                FROM book_copies AS bc
                JOIN borrow_requests AS loan ON loan.copy_id = bc.copy_id
                WHERE bc.book_id = c.book_id
                  AND loan.status = 'out'
                  AND loan.returned_on IS NULL
                  AND loan.due_on >= CURRENT_DATE
            )
        )
        OR (
            $1 = 'overdue'
            AND EXISTS (
                SELECT 1
                FROM book_copies AS bc
                JOIN borrow_requests AS loan ON loan.copy_id = bc.copy_id
                WHERE bc.book_id = c.book_id
                  AND loan.returned_on IS NULL
                  AND (loan.status = 'overdue' OR loan.due_on < CURRENT_DATE)
            )
        )
    )
      AND (
          NULLIF($2, '') IS NULL
          OR c.title ILIKE '%' || $2 || '%'
          OR COALESCE(c.author_names, '') ILIKE '%' || $2 || '%'
      )
)
SELECT
    f.book_id,
    f.title,
    f.isbn,
    f.author_names,
    f.total_copies,
    f.available_copies,
    f.first_acquired_year,
    COUNT(*) OVER () AS total_matches
FROM filtered AS f
ORDER BY
    CASE WHEN $3 = 'title' AND $4 = 'asc' THEN f.title END ASC NULLS LAST,
    CASE WHEN $3 = 'title' AND $4 = 'desc' THEN f.title END DESC NULLS LAST,
    CASE WHEN $3 = 'author' AND $4 = 'asc' THEN f.first_author END ASC NULLS LAST,
    CASE WHEN $3 = 'author' AND $4 = 'desc' THEN f.first_author END DESC NULLS LAST,
    CASE WHEN $3 = 'year' AND $4 = 'asc' THEN f.first_acquired_year END ASC NULLS LAST,
    CASE WHEN $3 = 'year' AND $4 = 'desc' THEN f.first_acquired_year END DESC NULLS LAST,
    f.book_id
LIMIT $6
OFFSET (($5 - 1) * $6);
```

There is no publication year in this schema. For the `year` sort I used the
earliest copy acquisition year instead; that is only a rough stand-in.
“Available” means the book has an in-collection copy with no unreturned
loan. “Out” means it has a current loan that is not overdue, and “overdue”
means it has a current overdue loan.

The React page already sends the filter and search text to the API; it
doesn't filter all 500 books in the browser. Right now, though, the API
loads its JSON-backed array and does the filtering, sorting, and pagination
in Node. With a database-backed API, the frontend can send the filter,
search, sort, and page settings and render just the page returned by this
query. It won't need to load and keep the full catalogue in memory just to
show one page.

# Exercise 2 — The join that lost half the rows

## Task 1: The obvious join

I joined books to copies and then to loans, selecting each book title with
its loan date. In my current database, that inner join returned **400,002
rows**, while `books` contains **4 rows**.

Those counts differ for two separate reasons:

- A book can have many loans, so it appears once for each matching loan.
  That is why the join result has many more rows than the books table.
- An inner join drops books that have no matching loan. “Untitled donation,
  box 14” has no loan rows, so it is absent from the joined result even
  though it is present in `books`.

The synthetic loans are heavily concentrated on the seeded copies: Dune
has 266,668 joined loan rows, “Constraint Test Book” has 66,667, and
“Stories from Karachi” has 66,667. “Untitled donation, box 14” has none.
The exercise describes around sixty missing titles, but this local database
has only four books, so these are the counts I actually observed.

## Task 2: INNER, LEFT, and RIGHT JOIN

Before running the queries, I guessed **400,002** rows for the INNER JOIN,
**400,003** for the LEFT JOIN, and **400,002** for the RIGHT JOIN. The
actual counts were:

| Join | Predicted | Actual |
|---|---:|---:|
| INNER JOIN (matching book-copy-loan rows) | 400,002 | 400,002 |
| LEFT JOIN (keep every book) | 400,003 | 400,004 |
| RIGHT JOIN (keep every loan) | 400,002 | 400,002 |

The INNER JOIN has one row per matching loan; books/copies without a loan
are left out. The LEFT JOIN keeps every book, but it also produces a
NULL-extended row for each copy with no loan. In this data there is one
such Dune copy, plus one row for “Untitled donation, box 14”, which has no
copies at all. That makes two extra rows, so the LEFT JOIN result is
400,004. The RIGHT JOIN keeps all loans; each loan has a matching copy and
book, so its count remains 400,002.

The corrected stock report starts from `books` and uses LEFT JOINs through
copies to loans. For a row with no matching loan, the loan ID and
`borrowed_on` are `NULL`. I would show a friendly label such as “Never
borrowed” instead of leaving the date cell blank. The query in
`db/queries.sql` does this with `CASE`.

## Task 3: The overdue notice

I joined `borrow_requests` to members, copies, books, and branches to get
the details for each overdue notice. I filtered for loans that have not
been returned and whose due date has passed. The query returned one row:
Aisha Khan, “Stories from Karachi,” Clifton Branch, due August 15, 2026,
62 days overdue (using the database date when I ran it).

I aliased every table in the final query: `loan`, `m`, `cp`, `bk`, and
`br`. The aliases make it easier to see which table each selected column
and join condition belongs to.

## Task 4: Many-to-many genres

Both lookups go through `book_genres`: to list a book's genres, I join
from `books` through the junction table to `genres`; to list books in a
genre, I start at `genres` and join through `book_genres` to `books`.
The first query returned Science Fiction for Dune, and the second returned
Dune for Science Fiction.

My first attempt to find books in both Science Fiction and Classics put
`g.name = 'Science Fiction' AND g.name = 'Classics'` on the same joined
genre row. That can never be true: one row's `g.name` cannot equal both
strings. This resembles the NULL mistake in that the condition is being
applied at the wrong level: the two requirements need to be satisfied by
separate related rows for the same book, rather than by one row.

The corrected query filters for either genre, groups those genre rows by
book, and keeps groups with two distinct matching genre names. There is no
`Classics` row in my `genres` table, so the requested Science Fiction +
Classics query correctly returns nothing with the current data.

To check that the query pattern can return a match, I used the existing
Local History genre instead. I temporarily linked Dune to both Science
Fiction and Local History inside a transaction; the query returned Dune
with two matching genres. I rolled the transaction back and verified that
the temporary link was gone, so the database is unchanged. The positive
test and rollback are included in `db/queries.sql`.

## Task 5: A table joined to itself

In this schema, a book's branch is determined by its physical copies, so I
self-joined `book_copies` to find pairs of different books with
in-collection copies at the same branch. The query returned Dune and
“Stories from Karachi” at Clifton Branch. I used an ID comparison between
the two copy rows so each pair appears only once, and excluded copies marked
missing or withdrawn.

I would use a self-join when I need to compare rows in the same table—for
example, to find two books sharing a branch or two members who joined in
the same month.

## Task 6: The four joins

My notation: `A` is the table on the left, `B` is the table on the right.
`[x]` means the row is kept, `[ ]` means it is dropped, and `NULL` means
the row is kept but the other side's columns come back empty.

**INNER JOIN**: only rows that match on both sides.

```
A only    match    B only
 [ ]       [x]       [ ]
```

Question: "Which loans are overdue, and who has them?" An overdue notice
only makes sense for a loan that has a member and a book, so the overdue
notice query from Task 3 joins `borrow_requests`, `members`, `book_copies`,
`books` and `branches` with inner joins.

**LEFT JOIN**: every row from A, plus B where there is a match.

```
A only    match    B only
 [x]       [x]       [ ]
 B = NULL
```

Question: "List every book with how many times it has been borrowed,
including books nobody has borrowed." This is the fixed stock report from
Task 2: `books LEFT JOIN book_copies LEFT JOIN borrow_requests`. Never-
borrowed books still show up, with `NULL` in the loan columns.

**RIGHT JOIN**: every row from B, plus A where there is a match.

```
A only    match    B only
 [ ]       [x]       [x]
                   A = NULL
```

Question: "Show every genre with its books, including genres that have no
books yet." Written as `books ... RIGHT JOIN genres`.

**FULL OUTER JOIN**: every row from both sides, matched where possible.

```
A only    match    B only
 [x]       [x]       [x]
 B = NULL          A = NULL
```

Question: "Which titles are at Clifton, which are at another branch, and
which are at both?" I would get the titles for each branch and full outer
join them on `book_id`. If one side is `NULL`, that branch doesn't have
the title.

**Rule: when you want "all the X, with their Y if they have one", use a
LEFT JOIN and put X on the left: `FROM X LEFT JOIN Y`.**


# Exercise 3 — Count, group, having

## Task 1: Five aggregates

| Question | Result |
|---|---|
| Total books | 4 |
| Total fines outstanding | 75.00 |
| Average loan length | 10 days |
| Oldest year | 1998 |
| Busiest single day | 2026-08-01 (401 loans) |

Fines outstanding is the total of `fine_assessed` on loans minus the total
of `fine_payments`. Only one loan has a fine (100.00) and 25.00 of it has
been paid, so 75.00 is still owed.

The average loan length only counts returned loans, because a loan that is
still out has no `returned_on` yet.

The schema doesn't have a publication year, so like in Exercise 1 I used
`acquisition_year` on `book_copies`. 1998 is the oldest copy acquired, not
the oldest book published.

## Task 2: Grouping

**Fines per branch:** Clifton Branch is the only one with fines: 100.00
assessed, 25.00 paid, 75.00 still owed. The other branches show 0.

**Loans per member:** Aisha Khan has 80,001 loans, four other members have
80,000 each, and "Delete Test Member" has 1.

**Books per genre:** Local History has 1 book and Science Fiction has 1.

**Loans per month:** 35 months, from December 2023 to September 2026,
mostly around 12,000 loans a month.

**The ungrouped column:** I added `loan.borrowed_on` to a query grouped
only by branch name. Postgres refused to run it:

```
ERROR: column "loan.borrowed_on" must appear in the GROUP BY clause
or be used in an aggregate function
```

That makes sense: one branch has thousands of loans with different dates,
so there isn't one `borrowed_on` to show for the group. Postgres won't guess.

MySQL is different. With `ONLY_FULL_GROUP_BY` turned off (the old default,
and still common in older setups) it runs the query and just picks a value
from somewhere in the group. You don't know which row it came from, so I
wouldn't trust that result. Postgres's error is the safer behaviour: if it
runs, the value is actually correct for the group.

**Rule: every column in the SELECT has to be either in the GROUP BY or
inside an aggregate like COUNT, SUM or MAX.**

## Task 3: WHERE or HAVING

My guess (in `guesses.md`) was `HAVING`, and that the `WHERE` version would
give an error about aggregates. Both were right.

I ran the wrong one first, with `WHERE SUM(...) > 10000`. Postgres stopped
straight away:

```
ERROR: aggregate functions are not allowed in WHERE
```

Then I moved the same condition into `HAVING` after the `GROUP BY`. It ran
fine but returned no rows, because the only branch with fines is Clifton and
it owes 75.00, nowhere near 10,000.

**WHERE filters individual rows before they are grouped, and HAVING filters
the groups after GROUP BY has worked out the totals.**

## Task 4: Members with more than three overdue books

This query uses everything from this exercise. It joins members to their
loans (and to payments), filters with `WHERE` to loans that are not returned
and past their due date, groups by member, counts the overdue books and sums
what's owed, keeps only members with more than three using `HAVING`, and
sorts the worst first.

For "total they owe" I used the same idea as Tasks 1 and 3: the fine on each
overdue loan minus anything already paid towards it. "Worst first" sorts by
the number of overdue books, then by the amount owed.

With `> 3` the query returned no rows. My data only has one overdue loan
(Aisha Khan's copy of "Stories from Karachi"), so nobody has more than three.

## Task 5: Trigger for available copies

The `books` table didn't have an available-copy count, so I added an
`available_copies` column and filled it with the number of in-collection
copies that aren't out on a loan. Then I wrote a trigger on
`borrow_requests`: when a loan is inserted the book's count goes down by
one, and when `returned_on` is set the count goes back up by one.

I tested it in DBeaver with no application code running:

| Step | Dune `available_copies` |
|---|---:|
| Before the loan | 3 |
| After inserting a loan for a Dune copy | 2 |
| After setting `returned_on` on that loan | 3 |

The count changed on its own both times, just from the SQL I ran in
DBeaver.

## Task 6: Checking today's queries against the indexes

The three queries from today that the app would run all the time:

| Query | What it filters / joins on | Index from Tuesday |
|---|---|---|
| Overdue notice (Ex 2, Task 3) | `returned_on IS NULL` and `due_on < today` on `borrow_requests` | `borrow_requests_overdue_due_on_idx` (partial index on `due_on` where not returned) |
| Every genre this book belongs to (Ex 2, Task 4) | `book_genres.book_id` | Primary key `(book_id, genre_id)` |
| Every book in this genre (Ex 2, Task 4) | `book_genres.genre_id` | **None** |

The first two are covered. The third one isn't. The primary key on
`book_genres` is `(book_id, genre_id)`, and because `book_id` comes first,
it only helps when you look up by book. Looking up by `genre_id` alone
can't use it, so Postgres would have to read the whole junction table. I
added `book_genres_genre_id_idx` on `book_genres (genre_id)` to the
database and to `schema.sql`.

What I missed: on Tuesday I looked at the composite primary key and
thought the junction table was already indexed. I was designing from the
schema, so I only saw that the table had an index, not which direction it
works in. Once I wrote the real query going from a genre to its books, it
was obvious the index only covers one direction. It's the same column-order
rule from the composite index task, and I still missed it on my own table.

# Exercise 4 — Choosing an ORM

## Task 1: The overdue notice in Prisma, Sequelize and Drizzle

I wrote the overdue notice query from Exercise 2 Task 3 in all three ORMs
using their docs. I haven't made any models yet so I just assumed names like
`Loan`, `Member`, `BookCopy`, `Book` and `Branch`, with camelCase fields
(`dueOn` for `due_on` etc).

**SQL (what I already have)**

```sql
SELECT m.name, m.email, bk.title, br.name, loan.due_on,
       CURRENT_DATE - loan.due_on AS days_overdue
FROM borrow_requests AS loan
JOIN members AS m ON m.member_id = loan.member_id
JOIN book_copies AS cp ON cp.copy_id = loan.copy_id
JOIN books AS bk ON bk.book_id = cp.book_id
JOIN branches AS br ON br.branch_id = loan.branch_id
WHERE loan.returned_on IS NULL
  AND loan.due_on < CURRENT_DATE
ORDER BY loan.due_on, loan.loan_id;
```

**Prisma**

```js
const today = new Date();

const loans = await prisma.loan.findMany({
  where: {
    returnedOn: null,
    dueOn: { lt: today },
  },
  select: {
    dueOn: true,
    member: { select: { name: true, email: true } },
    copy: { select: { book: { select: { title: true } } } },
    branch: { select: { name: true } },
  },
  orderBy: [{ dueOn: "asc" }, { loanId: "asc" }],
});

// Prisma can't do CURRENT_DATE - due_on here, so days overdue is worked out in JS
const notices = loans.map((loan) => ({
  memberName: loan.member.name,
  memberEmail: loan.member.email,
  bookTitle: loan.copy.book.title,
  branchName: loan.branch.name,
  dueOn: loan.dueOn,
  daysOverdue: Math.floor((today - loan.dueOn) / (1000 * 60 * 60 * 24)),
}));
```

**Sequelize**

```js
const { Op, literal } = require("sequelize");

const notices = await Loan.findAll({
  attributes: [
    "dueOn",
    [literal('CURRENT_DATE - "Loan"."due_on"'), "daysOverdue"],
  ],
  where: {
    returnedOn: null,
    dueOn: { [Op.lt]: literal("CURRENT_DATE") },
  },
  include: [
    { model: Member, attributes: ["name", "email"] },
    {
      model: BookCopy,
      attributes: [],
      include: [{ model: Book, attributes: ["title"] }],
    },
    { model: Branch, attributes: ["name"] },
  ],
  order: [
    ["dueOn", "ASC"],
    ["loanId", "ASC"],
  ],
});
```

**Drizzle**

```js
import { and, asc, eq, isNull, lt, sql } from "drizzle-orm";

const notices = await db
  .select({
    memberName: members.name,
    memberEmail: members.email,
    bookTitle: books.title,
    branchName: branches.name,
    dueOn: borrowRequests.dueOn,
    daysOverdue: sql`CURRENT_DATE - ${borrowRequests.dueOn}`,
  })
  .from(borrowRequests)
  .innerJoin(members, eq(members.memberId, borrowRequests.memberId))
  .innerJoin(bookCopies, eq(bookCopies.copyId, borrowRequests.copyId))
  .innerJoin(books, eq(books.bookId, bookCopies.bookId))
  .innerJoin(branches, eq(branches.branchId, borrowRequests.branchId))
  .where(
    and(
      isNull(borrowRequests.returnedOn),
      lt(borrowRequests.dueOn, sql`CURRENT_DATE`),
    ),
  )
  .orderBy(asc(borrowRequests.dueOn), asc(borrowRequests.loanId));
```

Drizzle looks the closest to the SQL, the joins are basically the same.
In Prisma and Sequelize I didn't write any joins, I just said which related
data I wanted and they do the joins themselves. In Prisma I couldn't do the
date subtraction in the query so I had to calculate days overdue in JS after.

## Task 2: Comparing the three

**Prisma**

It needs the least SQL. You don't write joins at all, you just say what
related data you want and it gets it. That's easy but I think you could use
it for a long time without really knowing what a join is.

For a few tables it's easy to read, but the nesting gets deep fast. Just to
get the book title I had to go `copy -> book -> title` with a `select`
inside a `select`. Also things like days overdue can't be done in the query,
I had to do it in JS.

If Prisma can't do something you use `$queryRaw` and write normal SQL.
So you still need to know SQL for the hard queries.

For migrations you change `schema.prisma` and run `prisma migrate dev`. It
creates the SQL migration file for you in `prisma/migrations`, and you can
open it and see the SQL. `prisma migrate deploy` runs them on another
database.

**Sequelize**

It needs some SQL knowledge. You don't write joins but you have to set up
associations like `hasMany` and `belongsTo` properly or the `include`
doesn't work.

I found it the hardest to read. Even my one query is a lot of nested
`include` arrays, and for the date part I had to write raw SQL inside
`literal()` with the table name in quotes.

When it doesn't support something you use `literal()` for a small part or
`sequelize.query()` for the whole query. I had to use `literal()` twice
just for this query.

Migrations are written by hand with `sequelize-cli` (an `up` and a `down`
function). They aren't made from the models, so the models and the
migrations can get out of sync. There's also `sync()` which changes the
tables to match the models but from what I read that's not safe to use on a
real database.

**Drizzle**

It needs the most SQL. It's pretty much SQL written in JS, you write every
join and condition yourself, so you have to know what you're doing.

For me it was the easiest to read because it's in the same order as the SQL
query. If I can read the SQL I can read this.

If something isn't supported you use the `sql` tag and write that part in
SQL, like I did for `CURRENT_DATE`. It fits in the query so it doesn't feel
like a workaround.

Migrations are similar to Prisma. You define the tables in code, run
`drizzle-kit generate` to make SQL migration files and `drizzle-kit migrate`
to run them.

**Which gives the best error messages for a trainee?**

I think Prisma. Since it generates the client from the schema, a lot of
mistakes get caught before the query even runs. If I spell a field wrong it
tells me that argument doesn't exist and shows the ones that do, and in
TypeScript the editor shows it straight away. Database errors also come
with a code like `P2002` (unique constraint failed) and the field name, so
it's easy to search.

Sequelize mostly just passes the Postgres error through, and some of its own
errors are confusing, like "Member is not associated to Loan" when you've
just set up the association the wrong way. Drizzle is good in TypeScript
because of the types, but when it fails at runtime it mostly just gives you
the Postgres error as it is.

## Task 4: Installing Prisma and running one query

Before installing I checked the version note: `prisma` and `@prisma/client`
both had to be the same major version. I installed them pinned to 7, and
`npx prisma --version` showed **7.10.0** for both. Prisma 7 also needs a
driver adapter to connect to Postgres, so I installed `@prisma/adapter-pg`
on the same version.

I didn't write the models by hand. I ran `npx prisma db pull`, which reads
the tables I already made on Tuesday and writes them into
`prisma/schema.prisma`. It picked up all 10 tables with their relations,
unique constraints and indexes, including the partial ones. It warned that
the `CHECK` constraints (like the loan `status` values) aren't supported by
Prisma Client, so those only exist in the database.

The connection string is in `.env` as `DATABASE_URL` and is only read in
the config module (`src/config/config.js`), with a check in
`config.schema.js`. `prisma.config.js` and `src/db/prisma.js` both import
it from there. The benchmark script from Exercise 1 was reading
`process.env.DATABASE_URL` directly, so I changed it to use the config too.

For the end-to-end query I ran the overdue notice through Prisma
(`db/prisma-check.js`). It returned the same row as the SQL version: Aisha
Khan, "Stories from Karachi", Clifton Branch, due 2026-08-15, 65 days
overdue.

## Task 5: Migrations

I generated the first migration (`init`) from the Prisma schema I pulled in
Task 4. Prisma doesn't create `CHECK` constraints, so I added the seven
checks (loan status, inventory status, fine amounts etc) to the end of the
migration file by hand.

To check it builds from nothing I made a new empty database,
`karachi_library_empty`, and ran `npx prisma migrate deploy` on it. All 10
tables were created with 11 foreign keys, 7 check constraints and the same
indexes as my real database (21 vs 20, the extra one is Prisma's own
`_prisma_migrations` table).

My real `karachi_library` database already had all the tables, so running
the migration on it would fail. I used `npx prisma migrate resolve
--applied` to mark `init` as already done there. That doesn't change any
tables or data, it just tells Prisma where the database is up to.

For the small change I added `publication_year` to `books`. The schema
never had it, which is why I kept using `acquisition_year` instead. The
second migration (`add_publication_year`) is just one line:
`ALTER TABLE "books" ADD COLUMN "publication_year" INTEGER;`. I applied it to
both databases with `migrate deploy`.

**What does a colleague run after pulling my branch?**

```
npm install && npx prisma generate
npx prisma migrate deploy
```

`npm install` gets the packages, `prisma generate` builds the client from
the schema (the generated folder isn't committed), and `migrate deploy`
runs any migrations their database doesn't have yet. This is in the README.

**What happens if they have the old schema and my new code?**

The code works with a database that has `publication_year`, but theirs
doesn't. Nothing warns them when the app starts. It only breaks when a
query touches `books`, because Prisma selects every column it knows about.
I tested this on a database with only the first migration and
`prisma.books.findMany()` failed with:

```
P2022 - The column `books.publication_year` does not exist in the current database.
```

So any route that reads books would return an error until they run
`migrate deploy`.