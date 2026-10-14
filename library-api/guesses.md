# Exercise 3 — Choosing what makes a row unique

## Task 1

**Why ISBN could make a good book key**

- It is a standard number intended to identify a published book edition.
- It is normally unique, so it seems like a natural way to find a book.
- It is printed on the book and may already be available in the catalogue data.

**Why ISBN could be a bad book key**

- Some books may not have an ISBN, so they would have no key.
- An ISBN identifies a particular edition or format, not the general work;
  a new edition may have a different ISBN.
- The library does not control ISBN assignment, so it depends on an outside
  identifier staying available and correct.

I expect an ISBN to be useful as a unique catalogue value, but I am not sure
it should be the primary key for the library's book record.

# Exercise 5 — What happens when you delete a member

## Task 2: Predictions before testing

- `ON DELETE CASCADE`: I expect deleting the member to delete that member's
  three loan rows as well.
- `ON DELETE RESTRICT`: I expect the database to refuse to delete the member
  while any of the three loan rows refer to them.
- `ON DELETE SET NULL`: I expect the database to keep the three loan rows but
  clear their `member_id` values.
- `ON DELETE NO ACTION`: I expect the database to refuse to delete the member
  while the loan rows refer to them, much like `RESTRICT`.

## Task 4: Prediction before testing

I do not expect `(status, due_on)` and `(due_on, status)` to perform
identically. For a query that filters to one status and orders by due date, I
predict `(status, due_on)` will work better: the index can find that status
first and then read those matching loans in due-date order. With
`(due_on, status)`, the database may have to scan entries for many due dates
before it can filter by status.
