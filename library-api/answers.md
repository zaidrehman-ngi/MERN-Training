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