# Exercise 1 — Database decision

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