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
books yet." Written as `books ... RIGHT JOIN genres`. It is the same as a
LEFT JOIN with the tables swapped, so in practice I would write
`genres LEFT JOIN book_genres LEFT JOIN books` instead, because it reads
in the order I think about it.

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

One thing to watch: a condition on Y has to go in the `ON` clause. If I put
it in `WHERE`, the rows where Y is `NULL` fail the condition and get
dropped, so the LEFT JOIN quietly behaves like an INNER JOIN again.
