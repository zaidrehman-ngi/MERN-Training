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