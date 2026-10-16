# Exercise 1 — Answer the question in SQL

## Task 3: Guess before timing

I predict that filtering, sorting, and limiting in SQL will be faster than
fetching every loan into Node and doing those operations there. The Node
approach transfers all 400,002 loan rows; the SQL approach transfers at most
10 rows (and likely fewer if fewer than ten loans are overdue).

As a rough network-volume prediction, transferring four fields for every
loan could be tens of megabytes, while ten matching rows should be only a
few kilobytes. The exact byte counts depend on row values and PostgreSQL's
wire encoding.

# Exercise 2 — The join that lost half the rows

## Task 2: Guess before running the joins

Before running the queries, for the books-to-copies-to-loans join I
predicted:

- `INNER JOIN`: **400,002 rows** — only matching loans appear, one row per
  loan.
- `LEFT JOIN` starting from books: **400,003 rows** — the loan matches plus
  one row for the book with no loan.
- `RIGHT JOIN` keeping loans: **400,002 rows** — every loan has a matching
  copy and book, and there are no unmatched loans.

These predictions assume the current data still has four books, 400,002
loans, and only one unmatched book/copy row. After running the queries, the
actual counts were **400,002 INNER**, **400,004 LEFT**, and **400,002
RIGHT**. My LEFT JOIN estimate was short by one because I overlooked that
Dune has a copy with no loan as well as the book with no copies.