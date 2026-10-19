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

# Exercise 3 — Count, group, having

## Task 3: WHERE or HAVING

I think this needs `HAVING`. The total outstanding fines for a branch is a
`SUM`, and that total only exists after the rows have been grouped by
branch. `WHERE` looks at one row at a time before grouping, so it can't
check a total.

If I use `WHERE SUM(...) > 10000` instead, I expect Postgres to give an
error saying aggregate functions are not allowed in `WHERE`.

After running it, both guesses were right: `HAVING` worked, and the `WHERE`
version failed with "aggregate functions are not allowed in WHERE".

# Exercise 6 — One hundred and one queries

## Task 4: One query with two joins, or three flat queries?

I think the one query with two joins will be faster. It's one round trip
to the database instead of three, and the joins are on primary keys
(`member_id`, `book_id`), so Postgres can find the matching member and book
for each of the 10 rows straight from the index. With three queries Node
has to send a query, wait, send the next one, wait again, and then match
everything up in JavaScript as well.

I don't think the difference will be big though, because it's only 10 rows
and my database is on the same machine, so a round trip is about 1 ms. I'd
guess the join is around 2 to 3 times faster but both are only a few
milliseconds.

After running it: I was right that the join was faster, about 2 times
(around 0.9 ms against 1.7 ms), and that both are only a millisecond or two.