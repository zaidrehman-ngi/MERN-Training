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
