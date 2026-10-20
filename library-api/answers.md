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

# Exercise 5 — The API stops pretending

## Task 1: Books through Prisma

The books repository now uses Prisma instead of the `db.json` array. The
routes, controllers, services, validation and error handling are the same,
I only changed the repository and passed Prisma into it from `app.js`.
Users and borrow requests still use the JSON data for now.

The API's book and my `books` table didn't match, so I had to make some
choices:

- **IDs:** the API uses ids like `bk-1` and Postman calls `/books/bk-1`, but
  my table uses UUIDs. I added an `api_id` column. New books get their id
  from a sequence (`bk-1004`, `bk-1005`...), starting at 1000 so it never
  clashes with the `bk-1` to `bk-9` ids from `db.json`.
- **Fields:** `year` goes into `publication_year` (from Exercise 4) and
  `onShelf` into `available_copies` (from Exercise 3). I added columns for
  `author`, `coverUrl`, `finePerDay`, `status` and `totalCopies`. I kept
  `author` as a text column instead of using the `authors` table because the
  API only ever has one author per book and needs `sort=author`, and Prisma
  can't sort by a field in a many-to-many table.
- **Delete:** Postman deletes `bk-1` (Dune) and expects 204, but Dune has
  copies and loans in my database, so a real delete is blocked by the
  foreign keys. I made it a soft delete with an `is_active` column, the
  same idea as members on Tuesday. ISBN only has to be unique among active
  books now.
- **Data:** `db/seed-books.js` (now run with `npm run db:seed`) loads the 159
  books from `db.json` into the database. One book had its year saved as the
  string `"2003"` and Prisma refused it, so the seed converts it. Running
  the seed again resets the books, so the Postman collection can be run
  more than once.

All of this went in as a third migration, `books_api_fields`.

**Postman results:** I ran the collection on the old JSON server first, so
I had something to compare against, then again on the Prisma version. Every
request returned the same status code. In the Books folder (with an admin
token) 11 of 13 checks pass on both. The 2 that fail were already failing
before: "Create Book" uses Dune's ISBN, so it gets a 409 instead of 201.
I also checked that a book from the database looks exactly the same as it
did in `db.json`, and that filtering, sorting and paging work.

## Task 2: Database errors in the error handler

With the JSON array nothing stopped bad data, but now the database does.
When it rejects something, Prisma throws a `PrismaClientKnownRequestError`.
Before this change my error handler didn't know that error, so it would have
sent a 500, and in development the message was Prisma's full
"Invalid `prisma.books.create()` invocation..." text with the constraint
names in it.

The three errors I got when I tried them directly through Prisma:

| What went wrong | Prisma code | Postgres code |
|---|---|---|
| Duplicate ISBN | `P2002` | `23505` |
| Foreign key to a row that doesn't exist | `P2003` | `23503` |
| CHECK constraint (negative copy count) | `P2039` | `23514` |

There wasn't actually a check on the copy counts in `books`, so I added a
small migration (`books_copy_count_check`) so `available_copies` and
`total_copies` can't go below 0.

I added `src/errors/prismaErrors.js`, which turns these into my normal
`ApiError`, and the error handler from Friday calls it first. The logs
still show the original database error so I can debug it, but the member
only sees my error shape:

| What went wrong | Status | Response |
|---|---|---|
| Duplicate ISBN | 409 | `CONFLICT`, "A book with this ISBN already exists.", field `isbn` |
| Missing foreign key | 422 | `VALIDATION_ERROR`, "A related record does not exist.", field e.g. `book_id` |
| Negative copy count | 422 | `VALIDATION_ERROR`, "One of the values is not allowed." |

I tested it by running the three failing Prisma calls through the real
error handler and got those exact responses. The Books folder in Postman
still gives the same results as before.

**The duplicate ISBN:** it's a 409 Conflict, and yes, it matches Week 1.
In my status code table I said 409 for "ISBN already belongs to another
book", and my API spec says 409 for conflicts with existing resources. I
used the same message and details as the books service, so it doesn't
matter if the duplicate is caught by the service check or by the database,
the response looks the same. The database one matters more, because if two
requests with the same ISBN come in at the same time, both could pass the
service check, and only the unique index stops the second one.

For the other two I first used 400, but then I checked my Week 1 spec: 400
is for missing or malformed fields, 422 is for a valid request with a bad
value. A negative count or an id that doesn't exist is a properly formed
request with a bad value, so I changed them to 422.

## Task 3: Members and borrow requests

I moved the other two repositories to Prisma the same way as books, so now
nothing reads `db.json` at runtime. `app.js` doesn't even import it any
more. `npm run db:seed` loads the books, users and borrow requests from
`db.json` into the database (and resets them for Postman).

**Members:** the API's users go into my `members` table. I added `api_id`
(`m-1000`...), `password_hash` and `role` columns. The API sends the branch
by name, so the repository looks it up in `branches`. "Gulshan Branch" was
in `db.json` but not in my database, so the seed adds it. If the branch
name doesn't exist you get a 422. Delete is a soft delete with `is_active`,
which I already had from Tuesday, and the unique email index was already
only for active members.

**Borrow requests:** these didn't fit my `borrow_requests` table. That
table is actually the loans: one row per physical copy someone has, with
status out/overdue/returned. A borrow request in the API is a member asking
for a book (pending/approved/rejected/returned) and it doesn't have a copy
yet. So I made a new table, `book_requests`, with a foreign key to
`members` and one to `books`, and left the loans table alone. The API path
is still `/borrow-requests`.

**Loading the relationships:** a borrow request now comes back with its
member and its book in one call:

```json
{ "id": "br-100", "bookId": "bk-1", "userId": "m-1000", "status": "pending",
  "requestedAt": "2026-01-10", "dueDate": "2026-01-20", "finePerDay": 20,
  "member": { "id": "m-1000", "name": "Aisha Khan", "email": "aisha0@lib.pk" },
  "book": { "id": "bk-1", "title": "Dune", "author": "Frank Herbert" } }
```

Prisma calls this a **relation query** or **nested read**, and you do it
with `include` (`include: { members: true, books: true }`). It's what other
people call eager loading.

To see the SQL I turned on Prisma's query log (`LOG_LEVEL=debug`). I
expected a JOIN, but Prisma doesn't write one. For one request it ran three
queries:

```sql
SELECT ... FROM "book_requests" WHERE "api_id" = $1 LIMIT $2 OFFSET $3
SELECT ... FROM "members" WHERE "member_id" = $1 OFFSET $2
SELECT ... FROM "books" WHERE "book_id" = $1 OFFSET $2
```

For the list of 40 requests it was still three queries, not 81. It gets
all the requests first, then all their members with
`WHERE member_id IN ($1, ..., $40)`, then all the books the same way, and
puts them together in JS. So `include` doesn't cause the N+1 problem, but
it also isn't a join. Prisma can do it as one query with a JOIN if you
turn on the `relationJoins` preview feature and pass
`relationLoadStrategy: "join"`. I tried it without the preview feature and
Prisma said `Unknown argument relationLoadStrategy`.

I also noticed it does `SELECT` of every column even if I only use a few,
so for members it pulls `password_hash` into memory too. Using `select`
instead of `include` would fix that.

**Postman:** I ran the whole collection on the JSON server before changing
anything and again after. All 25 requests returned the same status codes,
and the same 43 of 48 checks passed. The responses also look the same as
`db.json` apart from the new `member` and `book` objects.

## Task 4: Transactions

Borrowing a book is two writes: create the loan in `borrow_requests`, and
take one off `available_copies` on the book. I wrote this in
`db/transaction-demo.js`.

First I had to drop the trigger from Exercise 3 Task 5. It was still on my
database and it was doing the decrement itself inside the same `INSERT`,
so the problem would never show up. My decision in Exercise 3 was to keep
this in the code anyway, so I removed it with a migration
(`drop_available_copies_trigger`).

To make the second write fail I set Dune's `available_copies` to 0 first,
like someone had just taken the last copy. Taking one off makes it -1, and
the `CHECK (available_copies >= 0)` from Task 2 rejects it.

**Without a transaction:**

```
Before: open loans on this copy = 0, available_copies = 0
Second write failed: P2039 (Postgres 23514)
After:  open loans on this copy = 1, available_copies = 0
```

The loan was saved but the count wasn't changed. So the database says
someone has this copy, but the catalogue still counts it as on the shelf
(or here, says there were none to give out at all). I deleted that loan by
hand afterwards.

**With a transaction** (`prisma.$transaction(async (tx) => { ... })`, using
`tx` instead of `prisma` for both writes):

```
Before: open loans on this copy = 0, available_copies = 0
Second write failed: P2039 (Postgres 23514)
After:  open loans on this copy = 0, available_copies = 0
```

Same failure, but no loan was left behind. In the query log I could see the
`INSERT` for the loan and then a `ROLLBACK`, so Postgres threw the loan away
when the update failed. Either both writes happen or neither does.

**Two other operations that need the same treatment:**

1. **Returning a book.** Set `returned_on` and the status on the loan, add
   one back to `available_copies`, and work out the fine. If the loan is
   marked returned but the count isn't increased, the book looks like it's
   still out forever.
2. **Approving a borrow request.** Mark the request in `book_requests` as
   approved, create the loan for a copy, and take one off the count. If it
   fails half way, the member's request says approved but they never got a
   loan, or they got a loan for a request that still says pending.

## Task 5: Where does the code live?

I didn't have to move anything for this one. In Week 5 I already split it
into routes -> controllers -> services -> repositories, with one repository
per resource (`books.repository.js`, `users.repository.js`,
`borrowRequests.repository.js`). The controllers call things like
`services.books.list(req.query)`, the services call
`booksRepository.findAll(filters)`, and only the repositories use Prisma.
I checked with a search: none of the routes, controllers or services
import Prisma. That's also why Tasks 1 to 3 only needed the repository
files rewritten; the controllers and services didn't change.

**What I'd still have to change next week:** my repositories still do some
things that aren't data access. They turn rows into the API shape, and the
users and borrow request repositories throw HTTP errors (422 for a branch
or book that doesn't exist), so that would move up into the services, and
the borrow transaction from Task 4 is still only in a script instead of a
service.

## Task 6: Deleting db.json

I deleted `db.json`. The array loader was already gone from `app.js` since
Task 3, so the server started fine and nothing in `src/` was using it.

**Postman, first run:** exactly the same as the JSON server baseline. All 25
requests gave the same status codes and the same 43 of 48 checks passed.

**Postman, second run:** 11 checks failed instead of 5.

| Request | Run 1 | Run 2 |
|---|---|---|
| Create Book | 409 | 201 |
| Get Book `bk-1` | 200 | 404 |
| Update Book `bk-1` | 200 | 409 |
| Delete Book `bk-1` | 204 | 404 |
| Register User | 201 | 409 |
| Get / Update / Delete User `m-1000` | 200 / 200 / 204 | 404 / 404 / 404 |

So what was never real:

1. **The collection only ever worked because the data reset.** With the
   JSON array every change was only in memory, so restarting the server put
   `bk-1` and `m-1000` back. Now the data is actually saved: run 1 deletes
   `bk-1` and `m-1000` and registers `newuser@lib.pk`, and on run 2 they're
   still deleted and the email is already taken. The collection depends on
   hard-coded ids like `bk-1` existing, instead of creating its own record
   and using the id it gets back.
2. **The "Create Book" test only passes by accident.** It uses Dune's ISBN,
   so it fails while Dune exists and only passes once Dune has been deleted.
3. **My seed scripts.** `npm run db:seed` now fails with
   `Cannot find module ...db.json`, because the seeds were just copying the
   JSON file into the database. There's no way to reset the data for
   Postman any more.

One more thing I found: on run 2, updating `bk-1` gave 409 instead of 404.
The books service checks for a duplicate ISBN before it checks whether the
book exists, and "Test Book" from run 2 now has Dune's ISBN. That order was
there in Week 5 too, it just never showed up.

**What I did about it:** I replaced the two seed scripts with one,
`db/seed.js` (`npm run db:seed`), that has its own small test data inside
it instead of reading `db.json`: the 9 original books (`bk-1` to `bk-9`), 6
members including the two test logins, and 3 borrow requests. Running it
again removes anything the API created (anything with an id from the
sequences, like `bk-1004` or `m-5001`) and puts the test rows back. While
doing it I also stopped storing `test@lib.pk`'s password as plain text; the
seed hashes it with bcrypt now and login still works.

I also fixed the update order in the books service so it checks the book
exists first, so updating a deleted book now gives 404.

After that, with `npm run db:seed` before each run, the collection gives the
same results every time (43 of 48, same status codes as the JSON server).
I also ran it against `karachi_library_empty`, built only from the
migrations and the seed, and got the same results, so a colleague starting
from nothing gets the same as me.

# Exercise 6 — One hundred and one queries

## Task 1: Query logging

I already had Prisma's query log from Exercise 5, but it only came on with
`LOG_LEVEL=debug`, which turns on all the other debug logs too. I gave it
its own setting, `DB_QUERY_LOG=true` in `.env`, which goes through the
config module like everything else. In `src/db/prisma.js` Prisma sends each
query as an event and I print it with how long it took and its parameters:

```
[query] 7ms SELECT "public"."members"."member_id", ... FROM "public"."members" WHERE "public"."members"."member_id" IN ($1,$2,...) OFFSET $41 ["..."]
```

Loading `GET /borrow-requests` right now prints 3 queries: the requests,
then their members, then their books.

## Task 2: Building the N+1 bug

I wrote `db/n-plus-one-demo.js`. There were only 43 borrow requests, so it
first adds test ones until there are 100 (`npm run db:seed` removes them
again). Then it does it the wrong way on purpose: one `findMany` for 100
borrow requests, then a loop that does `findUnique` on `members` for each
one to get the name.

With `DB_QUERY_LOG=true` I counted the log: **101 queries**. 1 for the list,
then 100 that all look the same:

```
[query] 2ms SELECT ... FROM "public"."book_requests" ... LIMIT $1 OFFSET $2
[query] 1ms SELECT ... FROM "public"."members" WHERE "member_id" = $1 ...
[query] 1ms SELECT ... FROM "public"."members" WHERE "member_id" = $1 ...
... 98 more of the same ...
```

That pattern is the **N+1 query problem**: 1 query to get the list, then 1
more for every row (N). It scales badly because the number of queries grows
with the number of rows, and every query is a full round trip to the
database: Node sends it, waits, gets the answer, and only then sends the
next one, since the loop waits on each `await`.

On my machine it took 115 ms because the database is on localhost and each
round trip is about 1 ms. On a real server where each round trip is more
like 40 ms, 101 queries is about 4 seconds, which is the page from the
story: the server and database are idle, they're just waiting on each
other one query at a time.

At **a thousand rows** it's 1,001 queries. Even locally that's about a
second, and at 40 ms a round trip it's around 40 seconds for one page,
when the same data could come back in 1 or 2 queries.

## Task 3: Fixing it with include

I fixed it with Prisma's way of loading relations, `include`:

```js
const requests = await prisma.book_requests.findMany({
  take: 100,
  include: { members: true },
});
```

Then `request.members.name` is already there, no loop of queries. Counting
the log again:

| Version | Queries | Time (localhost) |
|---|---:|---:|
| Loop with `findUnique` per row | 101 | 186 ms |
| `include: { members: true }` | 2 | 14 ms |

The SQL it generated (shortened):

```sql
SELECT "book_requests"."request_id", ... FROM "book_requests"
ORDER BY "request_id" LIMIT $1 OFFSET $2;

SELECT "members"."member_id", "members"."name", "members"."email",
       "members"."password_hash", ... FROM "members"
WHERE "members"."member_id" IN ($1, $2, ..., $100) OFFSET $101;
```

Compared to the join I wrote by hand in Exercise 2 (the overdue notice):

- Mine was **one query** with `JOIN members AS m ON m.member_id =
  loan.member_id`, and Postgres matched the rows. Prisma made **two
  queries** with no JOIN: it gets the requests, collects their
  `member_id`s, asks for those members with `IN (...)`, and matches them up
  in JavaScript.
- I only selected the columns I needed (name, email, title...). Prisma
  selects every column of both tables, including `password_hash`, even
  though I only use the name.
- It sent all 100 `member_id`s in the `IN` list even though a lot of them
  are the same member.

**Why two and not one:** Prisma does this on purpose (its default
"query" strategy). A JOIN repeats the parent's columns on every row it
matches. That's fine for one member per request, but for a one-to-many like
"members with their loans" it gets big fast: a member with 80,000 loans
would have their name and email sent 80,000 times, and two to-many includes
in one JOIN multiply each other. Separate queries send every row only once,
and the number of queries depends on how many relations you include, not
how many rows there are, so it's still 2 queries at a thousand rows.
Prisma can do it as one query (`relationLoadStrategy: "join"` with the
`relationJoins` preview feature), but that's not the default.

## Task 4: One query with two joins vs three queries

My guess (in `guesses.md`) was that the single query with two joins would
be faster, because it's one round trip instead of three, but that both
would only take a few milliseconds.

I built both in `db/join-vs-three-queries.js` for the 10 most recent borrow
requests with their member and book. The join version uses
`prisma.$queryRaw` with `JOIN members` and `JOIN books`. The other one does
three `findMany`s (the 10 requests, then their members, then their books)
and matches them up in JavaScript with a `Map`. I checked both return the
same 10 rows, then ran each 500 times after a warm-up. I ran the whole
thing three times:

| Run | One query, two joins (median) | Three queries + JS (median) |
|---|---:|---:|
| 1 | 0.95 ms | 1.85 ms |
| 2 | 0.91 ms | 1.67 ms |
| 3 | 0.82 ms | 1.56 ms |

So the join was about 2 times faster on my data. Most of the difference is
just the two extra round trips, since my database is on the same machine.

**What would change it:**

- **A slower network** makes the join win by more. Every extra query costs
  a full round trip, so at 40 ms each the three queries would take about
  120 ms and the join about 40 ms.
- **One-to-many relations** can make the separate queries win. If it was
  "10 members with all their loans", the join would repeat each member's
  columns on every loan row (one of my members has 80,000 loans), while
  separate queries send each row once. That's the reason Prisma uses
  separate queries by default.
- **Missing indexes on the join columns.** My joins are on primary keys.
  Joining on a column without an index could make Postgres scan a whole
  table, and then the small `IN (...)` queries on primary keys could be
  faster.
- **Running the two lookups at the same time.** The members and books
  queries don't depend on each other, so with `Promise.all` it's really
  two round trips, not three, which gets closer to the join.
- **Caching.** If the members and books were already cached in the app,
  the separate version would only need the first query.

## Task 5: Fetch only what you need

My books don't have a long description column, but the borrow requests list
had the same problem. Every row in `GET /borrow-requests` came with full
`member` and `book` objects, and behind that Prisma's `include` was doing
`SELECT` of every column of the request, the member and the book. The
frontend's borrow requests page only shows the id, book id, user id, dates,
fine and status.

I changed the repository to use `select` with only the columns it sends
back. The list now gets just the member's name and the book's title
(`memberName`, `bookTitle`), and `GET /borrow-requests/:id` still returns
the `member` and `book` objects from Task 3 of Exercise 5.

For 100 borrow requests:

| | Before | After |
|---|---:|---:|
| HTTP response size | 27,999 bytes | 19,605 bytes |
| Data Prisma pulled from the database | 85,842 bytes | 23,356 bytes |
| Password hashes pulled into memory | yes | no |

The response got about 30% smaller, and what came out of the database
dropped by almost three quarters, because it was fetching things like every
member's `password_hash` and every book's ISBN, cover and counts just to
show a name and a title.

**The security version:** my member endpoints were not sending the password
hash, but only because `users.controller.js` deleted it with
`toPublicUser` before sending. The repository was returning `password` on
every user it loaded (`findAll`, `findById`, create, update), so it was in
memory everywhere, and any new route that forgot `toPublicUser` would have
leaked it. The borrow requests `include` was also loading every member's
hash.

I fixed it in the repository instead:

- `users.repository.js` has one `publicSelect` that lists the allowed
  columns, and `password_hash` isn't in it. Every method uses it, so the
  hash never leaves the database.
- There's one separate method, `findCredentialsByEmail`, that also selects
  the hash. Only the auth service uses it for login.
- I removed `toPublicUser` from the controller because there's nothing to
  delete any more.

I checked: the users repository now returns 0 rows with a password, `GET
/users` and register don't have a hash in them, the password column in the
database still has the bcrypt hash, login still works (and a wrong password
still gives 401), and the Postman collection gives the same results as
before.

## Task 6: Three symptoms

**1. A page that's slow with a hundred rows but fine with ten.**

Cause: N+1 queries. The code gets the list in one query and then runs
another query for every row (like the member loop in Task 2), so the time
grows with the number of rows. With ten rows it's 11 queries and nobody
notices, with a hundred it's 101 round trips.

First thing I'd look at: the query log (`DB_QUERY_LOG=true`) for one page
load. If the same query shows up over and over with only the id changing,
that's it, and the fix is loading the relation together (`include` or a
join).

**2. A query that's fast in DBeaver but slow through the ORM.**

Cause: it isn't actually the same query. The ORM is sending something
different from what I typed in DBeaver: more queries than I think (like
Prisma splitting `include` into separate queries), every column instead of
the few I picked, or a different `WHERE` / `ORDER BY` that can't use the
index. DBeaver also only fetches the first 200 rows by default, so it can
look fast while the app is fetching all of them.

First thing I'd look at: the query log, then copy the exact SQL it printed
into DBeaver with `EXPLAIN` in front of it, and compare it to my version.

**3. A response that's large but quick to produce.**

Cause: fetching and sending more than the page needs. The database finds
the rows quickly, but every column comes back (or whole related objects,
like the full member and book on every borrow request in Task 5), so the
response is big even though it was fast to build. It then gets slow for the
user on a slow connection, and it can leak things like the password hash.

First thing I'd look at: the response itself in Postman or the browser's
network tab, and its size. Then check which fields the page actually uses
and change the repository to `select` only those.

# Exercise 7 — Registration, done properly

## Task 1: The password column

I actually already had a `password_hash` column. I added it as `TEXT` in
Exercise 5 Task 3, just so the users from `db.json` had somewhere to go,
without thinking about the type. So this migration fixes it properly
instead of adding a new one.

Before deciding the type I generated some real hashes with the same
`hashPassword` function the app uses (bcrypt, 12 rounds):

```
60  $2b$12$HyXWmYJaknaVGu7ErXBxp.HU0HJ3QKq3F5jIrZtPvStfHIDT/YAdG   "test123"
60  $2b$12$ZRR9tLiq8DUC5.wGrrJZSum0QwyEApoFqY1SwBQHS0WhdSKrsF2aO   a long password with spaces and ünïcödé
60  $2b$12$Q0MVepkeB/jJW0xHkwDLOu6mKnPZD.yLqIXpzgUaWaOvmDbgsPPfW   ""
    $2b$10$KmSj0kc.24Agtf6/0WYPouFjBdE8sis.RcDFr.90M6EgsnIrqBLx2   10 rounds
    $2b$14$83n8BESKPQRA3Gf8J8VXauICkaPj5E8QThoI7fnVUVMsSPzoZiUwi   14 rounds
```

Every one is exactly **60 characters**, no matter how long the password is
or how many rounds. It's always `$2b$`, then the cost (`12$`), then 22
characters of salt and 31 of hash, and only letters, numbers, `.` and `/`.

So the migration (`members_password_hash_bcrypt`) does two things:

- Changes the column to **`CHAR(60)`**, because a bcrypt hash is always that
  exact length.
- Adds a **`CHECK`** that the value looks like a bcrypt hash
  (`^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$`). I tried saving `test123`
  in it straight from psql and Postgres rejected it, so a plain-text
  password can't end up in this column even by mistake. A real hash is
  accepted.

I kept the name **`password_hash`**. It says it's a hash, so nobody reading
the schema would think it's the actual password, which a column just
called `password` could look like.

I checked that registering, logging in (and a wrong password giving 401)
and the seed all still work with the new column.

## Task 2: POST /auth/register

`POST /api/v1/auth/register` uses `createUserSchema`, the same zod schema
from Friday that `POST /users` uses, then calls the users service. The
service checks the email isn't taken (409 if it is), hashes the password,
saves the member, and the route sends back 201 with the new member and a
`Location` header. I left `POST /users` as it was because the Postman
collection uses it.

```
POST /api/v1/auth/register  ->  201
Location: /api/v1/users/m-5013
{"data":{"id":"m-5013","name":"Leak Check","email":"leakcheck@lib.pk",
         "role":"user","branch":"Clifton Branch","joined":"2026-10-20"}}
```

**1. No hash in the response.** That was already fixed at the data layer in
Exercise 6: the users repository never selects `password_hash`, so the
member the service gets back doesn't have it. The response above has no
`password` or hash field.

**2. The password never reaches a log.** I registered with a password I
could search for (`Zebra-Leak-Check-9137`) and ran everything with the most
logging on (`NODE_ENV=development`, `LOG_LEVEL=debug`, `DB_QUERY_LOG=true`):
a normal register, the same email again, a bad email, a branch that doesn't
exist, broken JSON, and a login. Then I searched the server output and
`logs/access.log` for the password.

It found one leak: **the broken JSON one.** When the JSON can't be parsed,
Express's error has the raw request body on it, and my error handler logged
the whole error in development, so the log had
`body: '{"email":"leak3@lib.pk","password":"Zebra-Leak-Check-9137",,}'`.
I changed the error handler so for that error it only logs "Request body
contains invalid JSON (body not logged)", because even the error message
can quote part of the body.

The query log was also printing every parameter, which for a register is
the new bcrypt hash. It's not the password, but a hash in a log file can
still be cracked offline, so the query log now replaces anything that looks
like a bcrypt hash with `[hidden hash]`.

After both fixes I ran it all again: the password was in the logs 0 times
and there were no hashes either.

**3. The cost factor comes from config.** It was `const SALT_ROUNDS = 12`
in `src/utils/password.js`. Now it's `BCRYPT_COST` in `.env`, checked in
`config.schema.js` (a number from 10 to 15, default 12), and
`hashPassword` uses `config.bcryptCost`. I checked it: with
`BCRYPT_COST=10` the hash starts `$2b$10$`, with 13 it starts `$2b$13$`,
and with 4 the app refuses to start ("BCRYPT_COST: Too small").

I also added the members email index to the database error translation
from Exercise 5, so if two people register the same email at the same time
and the database catches it, they get the same 409 as the service check.

## Task 3: Two members with the same password

My guess (in `guesses.md`) was that the two stored values would be
different because of the salt. I registered two members through
`POST /auth/register`, both with the password `Library@2026`, and looked at
them in the table:

| api_id | name | password_hash |
|---|---|---|
| m-2001 | Sara Malik | `$2b$12$Y0j1cR/1VTlvKqN9qO3JAea1PIzNVeSa0F6eKe5uT7VDyRN0XG1dS` |
| m-2002 | Usman Tariq | `$2b$12$QFXXWkb7ybdOiJ9.EDy9WOyi4cpDSYsLEOFC78bKFefMNqOtX15Nm` |

(Later I added these two members to `db/seed.js` so they are always there
for the review. The seed hashes `Library@2026` again every time it runs, so
the exact values change after each `npm run db:seed`, but they always differ
from each other.)

They're different. The first 7 characters (`$2b$12$`, the algorithm and
cost) are the same, but the next 22 characters are the salt, and that's
random for each one, so the rest of the hash is different too. Both members
can still log in with `Library@2026`, because bcrypt reads the salt back out
of the stored value when it checks the password.

**What's different about seeing it in a table.** In Week 1 it was two
hashes printed by a script and then gone (and back then I actually guessed
they'd be the same). Here they're stored permanently, next to a name and an
email, in a table that has backups, can be exported from DBeaver, and that
anyone with database access can read. So this column is the part that
would actually get copied if the database was ever leaked, and that's when
the salt matters: in a table you can sort or group by `password_hash`, and
if the values were the same you'd see straight away which members share a
password.

**What an attacker with a copy of this table can do:**

- See every member's name and email, and which ones are admins or
  librarians from the `role` column. That alone is a leak.
- See the algorithm and cost (`$2b$12$`) and each salt, so they know exactly
  how to check a guess.
- Guess passwords offline, one member at a time: hash a guess with that
  row's salt and see if it matches. Nothing stops them trying as many times
  as they want. A common pattern like `Library@2026` would probably be found
  quickly from a word list.
- Go after one person they care about, like an admin.

**What they can't do:**

- Turn a hash back into the password. bcrypt is one-way, there's no
  decrypting it.
- Tell that Sara and Usman have the same password, because the hashes don't
  match.
- Use a rainbow table (a list of pre-computed hashes), because every hash
  has its own salt, so they'd need a separate table for every member.
- Crack everyone at once. Each guess only tests one member, and at cost 12
  each guess takes a noticeable fraction of a second, so trying a big list
  against all members takes a very long time.
- Log in with the hash itself. The login hashes whatever is typed in, so
  pasting the hash as the password doesn't work.

## Task 4: Email already registered

The decision is in `decisions.md`. In short: registration now gives the same
answer whether the email is new or already taken, to match my Week 1
decision that login shouldn't reveal if an account exists.

The two disagreed before this. Login said "Email or password is incorrect"
for both cases, but `POST /auth/register` (and `POST /users`) answered
`409 "A user with this email already exists."`, which tells anyone who has
an account.

What I changed:

- The users service hashes the password first, then if the email is taken it
  just doesn't save anything. Both `POST /auth/register` and `POST /users`
  now always reply `201` with
  `"Registration received. If this email wasn't already registered, the account has been created and you can log in."`
  There's no member data or `Location` header any more, because those would
  only be there for a new account and give it away. The frontend's register
  page doesn't use the response body, so it still works.
- Login checks against a dummy hash when the email doesn't exist.

I timed both before and after:

| Request | Before | After |
|---|---|---|
| Register, email already taken | 409, ~5 ms | 201, ~240 ms |
| Register, new email | 201, ~240 ms | 201, ~290 ms |
| Login, email doesn't exist | 401, ~4 ms | 401, ~245 ms |
| Login, real email, wrong password | 401, ~240 ms | 401, ~240 ms |

Before, both endpoints could be used to check if an email has an account,
register by its message and login by its timing. Now they look the same. A
taken email doesn't change the existing account (Sara could still log in
with her own password), the new account is created and can log in, and the
Postman collection still gives the same results.

## Task 5: How long registering takes

I timed `POST /auth/register` 10 times at each cost (after one warm-up):

| `BCRYPT_COST` | Average register time |
|---|---:|
| 12 | 301 ms |
| 14 | 1,150 ms |

Raising it by two made it about 4 times slower, because each +1 doubles the
work bcrypt does. Almost all of that time is the hashing; the database
insert is only a few milliseconds.

**Connecting it to Week 5.** On Week 5 Day 1 I wrote that `fs.readFile`
doesn't block because file reading happens outside the main thread, in
Node's thread pool, but a CPU-heavy loop runs on the main thread and blocks
the event loop. Hashing a password is CPU work, so the question is where it
runs.

I wrote `db/register-load-test.js` to find out. It sends 50 registrations at
the same time, and while they run it keeps timing two other requests:
`GET /` (only JavaScript on the main thread) and `GET /uploads/dune.jpg`
(a static file, so it needs a file read, which uses the thread pool). I ran
it with the normal `bcrypt.hash` (async) and then once with
`bcrypt.hashSync` swapped in just for the test.

| | Quiet server | During 50 registrations, async `hash` | During 50 registrations, `hashSync` |
|---|---|---|---|
| All 50 registrations done | | 5.1 s | 14.1 s |
| `GET /` | avg 14 ms | avg 19 ms, max 180 ms | avg 1,706 ms, max **13,408 ms** |
| `GET /uploads/dune.jpg` | avg 13 ms | avg 411 ms, max **4,166 ms** | avg 2,297 ms, max **13,452 ms** |

**With `hashSync`** it's exactly the CPU loop from Week 5. Each hash runs on
the main thread for about 250 ms, and nothing else can happen while it
does. 50 of them one after another is about 14 seconds, and every other
request to the server (the home page, the books list, a login, anything)
just waits for all of them to finish. One simple `GET /` took 13.4 seconds.
50 people signing up at once would freeze the whole API for everyone.

**With the async `bcrypt.hash`** (what my code uses) the hashing runs in the
thread pool, not on the main thread. So `GET /` stayed fast, because the
event loop was free. But it doesn't fully fix it, because the thread pool is
small: it has 4 threads by default (and my laptop has 4 cores). Only 4
hashes run at once and the other 46 wait in a queue, which is why all 50
took about 5 seconds. Anything else that needs the thread pool waits in the
same queue. That's why the static file went from 13 ms to up to 4 seconds:
its file read was stuck behind the password hashes. File reads, `dns.lookup`
and other `crypto` calls all use that pool.

So the async version helps a lot, because it keeps the event loop free for
normal requests, but the work isn't free, it's just moved. With 4 threads
the server can only hash about 4 passwords at a time, and while it does,
anything else that uses the thread pool is slowed down. Things that would
help: rate limiting the register and login endpoints so 50 can't arrive at
once, not setting the cost higher than needed, and for a lot of traffic
moving hashing to worker threads or a separate service. Making the thread
pool bigger (`UV_THREADPOOL_SIZE`) doesn't help much here, because there are
only 4 CPU cores to do the hashing anyway.

# Exercise 8 — Login and the token

## Task 1: POST /auth/login

I already had `POST /auth/login` from Week 5, but back then it checked
against the JSON file, and since Exercise 7 it checks real members in the
database. It finds the member by email (`findCredentialsByEmail`, the only
method that reads `password_hash`), compares the password with
`bcrypt.compare`, and on success signs a token with `jwt.sign` using
`config.jwtSecret`, with `expiresIn: config.jwtExpiresIn` (1 hour in my
`.env`). If the email doesn't exist or the password is wrong it's the same
401 "Email or password is incorrect." (and the same time, from Exercise 7
Task 4).

**Checking against Week 1 Day 4.** There I found `cnic` and `passwordHash`
in a token, and wrote that neither should ever be there, because a JWT
payload is only base64 encoded and anyone holding the token can read it. I
decoded a real token from my login:

```
before: {"sub":"m-5021","email":"sara.malik@lib.pk","role":"user","iat":...,"exp":...}
after:  {"sub":"m-2001","role":"user","iat":...,"exp":...}
```

Neither `cnic` nor `passwordHash` was in it (my members table doesn't even
have a CNIC column). But it did have the member's `email`, which the task
didn't ask for and which is the same kind of problem: personal information
that anyone with the token can read. Nothing used it except the refresh
endpoint copying it into the new token, so I took it out. Now the payload
is just the member id (`sub`), the role, and `iat`/`exp`.

I also changed the auth service so it removes the password hash from the
member before returning it to the controller. The controller never put it
in the token or the response, but it had no reason to have it at all.

Checked: the new token works on `GET /borrow-requests` (200), a `user`
token gets 403 on `GET /users`, refresh gives a token with the same small
payload, a token signed with a different secret gets 401 "Invalid token.",
and the Postman collection gives the same results as before.

## Task 2: requireAuth loads the real member

`requireAuth` used to verify the token and then trust whatever was in it.
Now it verifies the token, then loads the member from the database using the
id in the token (`findForAuth`, one small query on the primary key that only
selects the id, name and role). If the member doesn't exist any more or was
soft deleted, it's 401 "This account no longer exists." `req.user.role` is
set from the database, so `requireRole` now checks the member's real role
without me changing it.

**Public and protected routes.** On Week 5 Day 3 I listed the routes that
are public on purpose: `POST /auth/login`, `POST /users` (registration),
`GET /books` and `GET /books/:id`. `POST /auth/register` from Exercise 7 is
public for the same reason as `POST /users`. I called every route with no
token:

- Public, still working without a token: `GET /books` (200),
  `GET /books/bk-1` (200), `POST /users` (201), `POST /auth/register` (201),
  `POST /auth/login` (200).
- Protected, all 401 without a token: create/update/delete book, all five
  user routes apart from registration, all six borrow request routes
  (including approve and return), logout and refresh.

**Checking it uses the database and not the token**, with Sara's token
(a normal user):

| What I did | `GET /users` with the same token |
|---|---|
| Nothing (she's a user) | 403 |
| Changed her role to admin in the database | 200 |
| Changed her back to user | 403 |
| Used a token signed with the real secret that claims `role: admin` | 403 |
| Soft deleted her account | 401 "This account no longer exists." |

The Postman collection still gives the same results. The extra cost is one
query per protected request, about 1 to 2 ms. At first the lookup used
`findById`, which also loads the branch name and made it two queries, so I
gave auth its own smaller lookup. The decision about whether this is worth
it is in `decisions.md`.

## Task 3: When the token expires

I started the server with `JWT_EXPIRES_IN=10s` (the expiry comes from
config, so no code change), logged in as Sara and decoded the token: `iat`
and `exp` were 10 seconds apart. Straight after logging in,
`GET /borrow-requests` gave 200. I waited 12 seconds and called it again
with the same token. Exactly what came back:

```
HTTP/1.1 401 Unauthorized
X-Request-Id: req-1792499730751
Access-Control-Allow-Origin: http://localhost:5173
Content-Type: application/json; charset=utf-8
Content-Length: 68

{"error":"UNAUTHORIZED","message":"Token has expired.","details":[]}
```

Two things I noticed:

- The `error` code is `UNAUTHORIZED`, the same as when there's no token at
  all or the token is fake. Only the `message` says it expired, so a client
  would have to compare message text to know the difference.
- `POST /auth/refresh` with the expired token also gave the same 401
  "Token has expired." Refresh only works while the token is still valid,
  so once it has expired the only way back is logging in again.

**What my Week 4 Axios interceptor does with this today.** The response
interceptor in `library-web/src/api/client.js` only has cases for 404,
timeouts, no connection and 500+. A 401 falls through to the last one, so
the page shows:

> "Something went wrong. Please try again." / "Retry the request."

That's wrong in every way: nothing went wrong with the server, retrying
sends the same expired token and gets the same 401 forever, and the member
isn't told they need to log in again. (I also found the frontend never
sends the token as an `Authorization` header. It only sends the
`accessToken` cookie because of `withCredentials: true`, and my
`requireAuth` only reads the header, so the frontend's protected calls get
401 even with a fresh login. That needs fixing on one side or the other.)

**What it should do:**

1. Have its own case for 401. Don't show "something went wrong", and don't
   offer a retry, because retrying can't fix it.
2. If it's an expired token and refreshing is possible, try to get a new
   token once and then repeat the original request, so the member doesn't
   notice. With my API as it is that can't work, because refresh needs a
   token that hasn't expired, so it needs a proper refresh token (longer
   lived, only used for `/auth/refresh`). If refreshing fails, go to the
   next step and don't loop.
3. Otherwise clear whatever login state the app keeps (right now the
   frontend doesn't keep any, it just calls the login endpoint), send the
   member to the login page with a message like "Your session has expired,
   please log in again", and remember which page they were on so they go
   back there after logging in.
4. To make this easier, the API should send a different code for an
   expired token, like `TOKEN_EXPIRED`, instead of `UNAUTHORIZED`, so the
   interceptor can tell "expired, try to refresh" apart from "not logged in
   / invalid token, go to login" without reading the message.

## Task 4: Refresh tokens

Login now gives two tokens:

- The **access token**: the same JWT as before (member id and role), but
  only valid for **15 minutes** now (`JWT_EXPIRES_IN=15m`). It's sent with
  every request.
- A **refresh token**: a long random string (32 random bytes), valid for
  **7 days** (`JWT_REFRESH_EXPIRES_IN=7d`, through the config module like
  the rest). It isn't a JWT, because the server has to look it up in the
  database anyway to check if it was revoked. It goes in an `httpOnly`
  cookie with `Path=/api/v1/auth/refresh`, so page JavaScript can't read it
  and the browser only sends it to the refresh endpoint, not with every
  request.

The database only stores a SHA-256 hash of the refresh token, in a new
`refresh_tokens` table (migration `refresh_tokens`), with when it expires
and when it was revoked. A fast hash is fine here, unlike for passwords,
because the token is random and far too long to guess.

`POST /auth/refresh` no longer needs a valid access token. It reads the
refresh token cookie, checks it in the database (exists, not revoked, not
expired, member still active), revokes it, and sends back a new access
token **and a new refresh token** (rotation), so each refresh token only
works once.

What I tested, with the access token set to 5 seconds:

| Step | Result |
|---|---|
| Login | both cookies set; refresh one has `Path=/api/v1/auth/refresh`, `HttpOnly`, 7 days |
| Database | 64-character hash stored, not the 43-character token |
| Access token after 6 seconds | 401 "Token has expired." |
| `POST /auth/refresh` with the cookie | 200, new access token, new refresh token |
| New access token | 200 |
| Old refresh token used again | 401 `INVALID_REFRESH_TOKEN` |
| No cookie, or a made-up token | 401 |
| Member soft deleted, then refresh | 401 |

The Postman collection still gives the same results.

**What problem it actually solves:** a stolen access token works for anyone
until it expires and can't be taken back, but it's only good for 15
minutes, while the refresh token, which lasts 7 days, is never sent with
normal requests or readable by page JavaScript, so it's much harder to
steal. And if a refresh token is stolen anyway, it can be revoked in the
database and only works once, so the thief loses it as soon as the real
member refreshes, instead of having a long-lived token that can't be
cancelled.

One thing still missing: logout doesn't revoke the refresh token yet, so
until it does, the cookie keeps working for 7 days after logging out. I
left it because the Postman collection calls Refresh after Logout and
expects 200.

## Task 5: Logout

I couldn't find my Week 1 answer about un-issuing tokens in the repo (I
searched every branch and the git history). The two usual ways are a
**denylist** (remember the ids of logged-out tokens until they expire and
refuse them) or **short-lived access tokens plus revocable refresh tokens**
(don't track access tokens, just let them run out). I went with the
denylist, because it's the only one that stops the old token straight away.

**First, the test on the old logout**, before changing anything: log in,
log out, replay the old token.

```
logged in, protected route: 200
logout: {"message":"Logged out successfully."} -> 200
replay OLD access token after logout: 200
refresh with the cookie after logout: 200
```

So my logout was **cosmetic**. It only sent back a message. The token kept
working until it expired, and the refresh cookie could keep getting new
tokens for 7 days.

**What I built:**

- Every access token now gets its own id (`jti`, a UUID) when it's signed.
- New table `revoked_tokens` (`jti`, `expires_at`). Logout puts the token's
  `jti` in it with the token's own expiry, revokes the refresh token, and
  clears both cookies. Rows whose expiry has passed get deleted, because
  those tokens are rejected anyway, so the table stays small.
- `requireAuth` checks the list on every request and refuses a listed
  token with 401 "This token has been logged out." It also refuses tokens
  without a `jti`, since every real token has one now.

**The test again, after:**

| Step | Result |
|---|---|
| Logged in | 200 |
| Logout | 200, both cookies cleared |
| Replay the old access token | **401 "This token has been logged out."** |
| Replay the old refresh token | **401 `INVALID_REFRESH_TOKEN`** |
| Logout again with the same token | 401 |
| Same member logged in on another device | still 200, refresh still works |
| Logging in again | new token works |

The first time I ran this, the old refresh token still worked after logout.
In Task 4 I had set the refresh cookie's path to `/api/v1/auth/refresh`, so
the browser (and curl) never sent it to `/api/v1/auth/logout`, and logout
never saw it to revoke it. I changed the path to `/api/v1/auth`, which
still keeps it away from every non-auth route.

**The Postman collection** called Logout in the middle and then kept using
the same token for Refresh, all the borrow request requests and the wrong
role check. That only ever worked because logout didn't do anything. With a
real logout 7 requests got 401, so I moved the Logout request to the end of
the collection (its own folder, "Logout (runs last)"). I didn't change any
request or test. With that, every request gives the same status code as the
JSON server baseline again.

**Limits:** it's one more small query on every protected request, and
logout only ends the session it's called from. Logging out everywhere (for
example after a stolen phone) would need something like a "tokens valid
after" time on the member, which `requireAuth` could check in the same
member lookup it already does.

## Task 6: The whole flow in Postman

I added a folder to the collection, **"Exercise 8 Task 6 - Full Auth Flow"**,
with the seven requests in order. It keeps its own token in a separate
environment variable (`flowToken`) so it doesn't mix with the `accessToken`
the rest of the collection uses.

| # | Request | What the tests check |
|---|---|---|
| 1 | `POST /auth/register` | 201, the registration message, no "password" or bcrypt hash anywhere in the response. A pre-request script makes a new email every run (`flow-<time>@lib.pk`). |
| 2 | `POST /auth/login` | 200, got an `accessToken` for the member who just registered, and the token's payload only has `sub`, `role`, `iat`, `exp`, no email, password, hash or cnic. Then it **saves the token** into `flowToken`. |
| 3 | `GET /borrow-requests` | 200 and a list, using `{{flowToken}}`. |
| 4 | `GET /users` | 403 `FORBIDDEN` in the standard error shape, because a normal member isn't allowed. |
| 5 | `GET /borrow-requests` again | A pre-request script reads `exp` from the token and waits until it has passed, then the test checks 401 "Token has expired." |
| 6 | `POST /auth/refresh` | 200, a new access token for the same member (no token sent, the refresh cookie from login is sent by itself), and the new token works on the protected route. Saves the new token. |
| 7 | `POST /auth/logout` | 200, and then it replays the same token and checks it now gets 401 "This token has been logged out." |

The expiry step only waits if the token expires within 60 seconds, so for
the demo the API has to be started with `JWT_EXPIRES_IN=10s` (I put the
commands in the README). With the normal 15 minutes, step 5 doesn't wait
and fails, which is right, because the token hasn't expired.

I ran it with newman: all 7 requests and all 17 assertions passed, and step
5 waited 11 seconds for the real expiry. Running the whole collection gives
65 assertions with only the same 5 failures the collection had on the JSON
server.

At first newman printed a warning that `atob` (which I used to decode the
token payload) is deprecated in its sandbox, so I changed it to
`Buffer.from(..., "base64")`.