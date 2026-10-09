# Exercise 1

## Task 4

For the capstone, I recommend PostgreSQL for the Karachi Central Library
System.

First, borrowing connects members, books, copies, and branches. PostgreSQL can
check that a borrowing record refers to records that exist. It also makes it
straightforward to look up a member's history or everyone who borrowed a book.

Second, the library needs reports like overdue books and fines by branch.
PostgreSQL lets us keep member, branch, and fine-rate details in one place and
use them in those reports.

The trade-off is that a book and its copies are stored in separate related
tables, so showing them together takes an extra step. Changing the table
structure to add new kinds of catalogue details may also take more work.

If the main feature were browsing many different kinds of material, each with
its own details and copies shown together, I would consider MongoDB instead.
That information could be kept together in each item's document.


# Exercise 3

## Task 1

For the capstone `Books` table, I will use a generated `book_id` as the
primary key. I will keep ISBN as an optional unique value when a book has one.

Some library records have no ISBN, as the Week 2 fixture shows, so ISBN cannot
identify every book the library needs to record. An ISBN also identifies a
particular edition and format; a new edition gets a new ISBN. The library
needs an ID it can keep using for its own book record even when an ISBN is
missing or changes with an edition.

The general rule I am taking away is: use a generated key for the database's
stable internal identity, and keep a natural key as a unique constraint when
it is available and useful. A real-world value can look like a perfect key
but still be missing or change over time.