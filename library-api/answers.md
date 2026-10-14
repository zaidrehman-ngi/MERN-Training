# Exercise 1 — MongoDB or PostgreSQL

### Task 1

I would model the relational version as three tables:

- `Books`: one row per book title, with its ID, title, author, and ISBN.
- `Members`: one row per member, with their ID, name, email, phone number, and
  join date.
- `BorrowRequests`: one row per borrowing event, with its ID, member ID, book
  ID, copy number, borrowed date, due date, returned date, and status.

The member ID and book ID in `BorrowRequests` link each request to a member
and a book. Member and book details are saved once instead of being repeated
in every borrowing record.

For MongoDB, I would use three collections as well. A book document holds book
details, and a member document holds member details. Each borrow request is its
own document, with member and book IDs linking it to the other documents:

```js
// books
{
  _id: "book-id",
  title: "Dune",
  author: "Frank Herbert",
  isbn: "9780441013593",
  genres: ["Science Fiction", "Classic"]
}

// members
{
  _id: "member-id",
  name: "Aisha Khan",
  email: "aisha@lib.pk",
  phone: "0300-1234567",
  joined: "2021-04-02"
}

// borrowRequests
{
  loanId: "L-1001",
  memberId: "member-id",
  bookId: "book-id",
  copyNumber: 1,
  borrowedOn: "2026-03-02",
  dueOn: "2026-03-16",
  returnedOn: "2026-03-14",
  status: "returned"
}
```

I would not embed borrow requests inside members or books. A request belongs to
both a member and a book. Keeping requests in their own collection avoids
copying the same request into both places and lets us find history by member
or by book. The tradeoff is that we have to look up the member or book
separately when we want to show those details with a request.

### Task 2

For this comparison, I would give each physical copy its own row in the
relational design and link it to its book. In MongoDB, I would keep a book's
copies inside that book's document. Borrow requests stay in their own table
or collection in both designs.

1. **List every book currently overdue, with the member's name**
   - Relational: connect `BorrowRequests` to `Books` and `Members`, then find
     requests that are not returned and are past their due date.
   - Document: find overdue borrow requests, then look up the matching book
     and member documents.
   - **Easier: relational.** The tables can be connected directly for this
     question.

2. **How many copies of Dune are on the shelf right now**
   - Relational: find Dune in `Books`, then count its copies in `BookCopies`
     that are marked as on the shelf.
   - Document: find Dune's document and count the copies inside it that are
     marked as on the shelf.
   - **Easier: document.** The book and copies are stored together, so we can
     read them in one place. This works best when a book has a manageable
     number of copies.

3. **Every book one member has ever borrowed**
   - Relational: find that member's `BorrowRequests`, connect them to `Books`,
     and list each book once.
   - Document: find that member's borrow requests, look up the books they refer
     to, and remove repeats.
   - **Easier: relational.** It is straightforward to connect the request and
     book tables and list each book once.

4. **Every member who has ever borrowed one book**
   - Relational: find the book's `BorrowRequests`, connect them to `Members`,
     and list each member once.
   - Document: find requests for that book, look up the members they refer to,
     and remove repeats.
   - **Easier: relational**, because it is straightforward to connect these
     tables.

5. **Total fines collected per branch last month**
   - Relational: add up the payments made last month and group the totals by
     branch.
   - Document: find last month's payment records, add them up by branch, and
     look up branch details if needed.
   - **Easier: relational.** The spreadsheet has `fine_charged`, but no record
     of when a fine was paid. So it cannot tell us how much was collected last
     month. Either design would need payment records with dates.

6. **The fine rate changes from Rs 20 to Rs 25 — update it**
   - Relational: change the current rate in one shared place, and keep the
     rate used for old loans on those loan records.
   - Document: change the rate in one shared document, and keep the rate used
     for old loans on those loan records.
   - **Neither is clearly easier** if the current rate is stored once in both.
     Copying it onto every book or member would mean changing many records and
     could leave some with the old rate.

Keeping a book's copies inside its document makes the on-shelf count the
clearest document-database win in this set. Documents are not easier for every
question: relational tables make it easier to follow borrowing history and
make branch reports.

### Task 3

For this library, a document database has some real advantages:

1. Keeping a book and its physical copies together makes it easy to show its
   availability in one read, without looking in another collection.
2. Different kinds of material can have different details. A print book and
   an audio recording do not need identical fields.
3. A book and its copies can be updated together in one document. This helps
   keep that book's copy information in step.

A relational database has these advantages:

1. The database can check that every borrow request refers to a member, book,
   and copy that exist, and can prevent duplicate ISBNs or member emails.
2. It is easier to get a member's borrowing history, or find all the members
   who borrowed a book, by connecting the related tables.
3. Member, branch, and fine-rate details can each be stored once. Updating
   them in one place avoids mismatched copies in different records.

The one-document update advantage applies when changing a book and its own
copies. A borrowing also involves a member and a request, so those records are
still separate. For this library, relational tables fit the history and
reporting questions well.

# Exercise 2 — The spreadsheet that became a database

### Task 1

1. Member name, email, phone, and join date are repeated on each borrowing
   row, so changing a member's details means finding and correcting every copy.
2. Aisha has two different email addresses in the sheet, so staff may not know
   which one is current or be able to reliably find all her records by email.
3. The same author is written in different ways, such as `Frank Herbert`,
   `frank herbert`, and `F. Herbert`, so searches and author lists can split one
   person into several entries.
4. Book identity is unclear because `Sindhi Folk Tales` has no ISBN, while
   `The Harbour` appears with two different authors and ISBNs; relying on title
   alone could mix up different books.
5. `book_genres` can contain several comma-separated genres in one cell, so it
   is awkward to search or count books by one genre accurately.
6. `total_copies` is repeated on borrowing rows for the same title, so a stock
   change has to be copied to multiple rows and those values can disagree.
7. Branch name, address, and phone are repeated across loan rows, so correcting
   a branch's details requires updating many records.
8. Gulshan Branch has two different phone numbers for the same address, so a
   librarian cannot tell which number to give to a member.
9. Dates use different formats, such as `2026-03-09`, `15/03/2026`, and
   `March 3, 2026`, so sorting and date calculations can fail or give the wrong
   result.
10. Fine amounts are written as text like `Rs 20`, while `days_late` and
    `fine_charged` are stored calculated values; this makes totals harder to
    calculate and lets saved amounts become out of date when dates or rates
    change.
11. The `Coastal Flora of Sindh` inventory row has no loan or member details
    mixed into the same sheet as borrowing records, so it is unclear whether
    blanks mean “not borrowed” or missing loan information.

### Task 2

1. **Update anomaly:** If Aisha changes her email, the librarian has to update
   every row containing her member details. Her records are on CSV lines 2, 3,
   and 4. If only some are changed, the spreadsheet says she has two email
   addresses and staff may contact the wrong one.
2. **Insertion anomaly:** The library cannot add a new book without also
   making a borrowing row, because book details share rows with loan and member
   details. CSV line 10 shows the workaround: `Coastal Flora of Sindh` is
   entered with the loan and member columns left blank. That makes it unclear
   whether the blanks mean “not borrowed” or missing data.
3. **Deletion anomaly:** `Sindhi Folk Tales` appears only on CSV line 7, in
   loan `L-1006`. If that only loan row is deleted, the sheet also loses the
   only record of the book's title, author, ISBN field, genres, and copy
   information.

### Task 3

The `book_genres` column has more than one value in a cell. For example,
`Dune` has `Science Fiction, Classic` on CSV line 2. If genres stay packed
into text like that, counting science fiction books means searching inside
strings. That can miss spelling or spacing differences, and it can count
matches incorrectly.

I would make `Genre` a table, not a column on `Books`, because a book can have
more than one genre and the same genre can describe many books. I would add a
`BookGenres` join table with one row for each book-and-genre pair:

```text
Genres:     genre_id, name
BookGenres: book_id, genre_id
```

Then Dune would have separate links to `Science Fiction` and `Classic`. To
count science fiction books, the database can find that genre and count the
books linked to it. The cost is an extra table and a join when reading a
book's genres, and adding or removing a genre means changing rows in the join
table instead of editing one text cell.

### Task 4

I would do this in two steps. First, split out the member, book, and genre
details so they are not copied into every borrowing row. Then, in the 3NF step,
split out branch details, because those depend on the branch rather than
directly on a borrowing.

One detail about the key: each borrowing row already has a unique `loan_id`.
Because that is a single-column key, the original rows have no composite key
with partial dependencies, so they technically already meet the 2NF rule. The
first layout below is the useful intermediate design; the key point of the
next step is removing the branch dependency.

**After the 2NF step**, I would have:

```text
Members(member_id, name, email, phone, joined)
Books(book_id, title, author, isbn)
BookCopies(copy_id, book_id, copy_number)
Genres(genre_id, name)
BookGenres(book_id, genre_id)
BorrowRequests(
  loan_id, member_id, copy_id,
  branch_name, branch_address, branch_phone,
  borrowed_on, due_on, returned_on, fine_per_day, status
)
```

The borrowing row now points to one member and one book instead of repeating
their details. Each physical copy has a row in `BookCopies`, so the total
number of copies can be counted instead of repeated in `Books`. Genres are in
their own table, linked to books by `BookGenres`. Branch name, address, and
phone are still together in `BorrowRequests` at this stage. I would calculate
`days_late` and the fine from the dates and the recorded `fine_per_day`, rather
than save extra calculated values that could get out of sync.

**For the 3NF step**, I would move branch details into their own table:

```text
Branches(branch_id, branch_name, branch_address, branch_phone)
BorrowRequests(
  loan_id, member_id, copy_id, branch_id,
  borrowed_on, due_on, returned_on, fine_per_day, status
)
```

The reason is that a loan identifies a branch, and the branch name identifies
its address and phone. In other words, the address and phone depend on
`branch_name`, not directly on `loan_id`. Keeping them on every loan repeats
the same branch facts. Clifton Branch's details repeat on CSV lines 2, 3, 4,
and 8. Gulshan Branch also has different phone numbers on lines 7 and 11, so a
separate branch record would make that disagreement visible and give the
library one place to correct it.

This split means one extra table and a link when showing a loan with its branch
details, but the branch's address and phone only need to be stored once.

### Task 5

The two calculated columns are `days_late` and `fine_charged`.

- **`days_late`: compute it.** For a returned book, work it out from the due
  date and returned date. For a book that is still out, work it out using
  today's date. This way the number of late days keeps moving forward while
  the book is overdue, without someone having to update it every day.
- **`fine_charged`: store the assessed amount.** It looks like days late times
  the daily fine rate, but calculating it later using the library's current
  rate could change an old loan's fine. The spreadsheet already shows why:
  most rows use `Rs 20`, while `L-1009` uses `Rs 25`. I would save the rate
  applied to each loan and the final fine assessed when it is worked out.

An assessed fine is not necessarily money collected. To report payments, the
system would also need to record each payment and when it was made. The risk
is treating a fine as a live calculation after the rate changes and silently
changing what a member owes for an old loan.

### Task 6

Before writing SQL, this is the table layout I would use:

```text
Members
  member_id, name, email, phone, joined_on

Authors
  author_id, name

Books
  book_id, title, isbn

BookAuthors
  book_id, author_id

Genres
  genre_id, name

BookGenres
  book_id, genre_id

Branches
  branch_id, name, address, phone

BookCopies
  copy_id, book_id, copy_number, branch_id

BorrowRequests
  loan_id, member_id, copy_id, branch_id,
  borrowed_on, due_on, returned_on, fine_rate_per_day, fine_assessed

FinePayments
  payment_id, loan_id, amount, paid_on
```

`BookCopies` has one row per physical copy, so there is no repeated
`total_copies` value. A copy is on the shelf when it has no active borrowing
request. `FinePayments` is separate because a fine being assessed is not the
same as money being paid.

Checking the eleven problems from Task 1:

1. Repeated member details: **eliminated** by storing them once in `Members`
   and referring to `member_id` from each borrowing request.
2. Aisha's two emails: **not solved by table design alone**. `Members.email`
   should be unique, but someone must confirm which email is correct and
   combine her old rows under one member before loading the data.
3. Author spellings: **prevented from repeating** by `Authors` and
   `BookAuthors`, but the three spellings still need to be checked and matched
   to the right author during cleanup.
4. Unclear book identity: **improved** by giving each book a `book_id` and
   using ISBN as a unique value when one is available. The missing ISBN for
   `Sindhi Folk Tales` still needs checking; a title alone is not guaranteed
   to identify a book.
5. Several genres in one cell: **eliminated** by `Genres` and `BookGenres`,
   with one row per book-and-genre link.
6. Repeated total copy counts: **eliminated** by recording each physical copy
   once in `BookCopies` and counting those rows.
7. Repeated branch details: **eliminated** by storing branch information once
   in `Branches` and referring to its ID.
8. Conflicting Gulshan phone numbers: **prevented from recurring**, but the
   library still needs to confirm which phone number is correct before import.
9. Mixed date formats: **eliminated going forward** by using date columns for
   borrowing, due, return, join, and payment dates; old values still need to
   be converted carefully during import.
10. Text money and saved calculations: **addressed** with numeric fine and
    payment amounts, a stored rate and assessed fine for each loan, and no
    stored `days_late` value. The old `Rs` text values need cleaning as they
    are imported.
11. A book that has not been borrowed: **supported** because books and copies
    exist independently of `BorrowRequests`; the sheet's blank loan row is no
    longer needed.

The tables prevent many of these problems from being repeated, but they do
not repair incorrect source data automatically. The conflicting emails,
author spellings, branch phone, and missing ISBN need checking before the
spreadsheet is loaded.


# Exercise 3 — Choosing what makes a row unique

## Task 2

For this library system, I would use UUIDs for generated IDs.

- **Auto-incrementing integers:** They are short and easy to read in a URL,
  such as `/books/4471`. The cost is that two branches working separately
  could both create book `4471`, so their records could conflict when the
  databases are merged. The number also gives a rough idea of how many
  records exist, and someone could try nearby IDs. The API still needs
  permission checks; an ID is not a security check.
- **UUIDs:** Separate branches can generate IDs independently, so ID
  conflicts are very unlikely when their databases are merged. A UUID in a
  URL is also much harder to guess than a sequence number. The cost is that
  URLs are longer and less readable, and UUIDs take more space than integers.
- **Natural values such as ISBN:** They can be meaningful to staff and avoid
  a separate generated value when present. But some library items have no
  ISBN, and an ISBN can change for a new edition or format, so it cannot be
  the key for every book record.

I would use UUIDs as the primary keys for `Members`, `Authors`, `Books`,
`Genres`, `Branches`, `BookCopies`, `BorrowRequests`, and `FinePayments`.
Their foreign-key columns would also use UUIDs. `BookAuthors` and
`BookGenres` would use the pair of UUID foreign keys as a composite primary
key, since each row represents a link between two records. ISBN would remain
an optional unique value on `Books`, not a primary key.

## Task 3

I am using PostgreSQL for this exercise. I created the `members`, `books`,
and `branches` tables in the `karachi_library` database and checked that all
three appear in DBeaver. Their UUID primary keys are generated
automatically. These tables do not have foreign keys directly between them:
the relationship between books and branches belongs in `BookCopies`, and
borrowing records will refer to members and copies in `BorrowRequests`.

## Task 4

I added the constraints while creating the tables in PostgreSQL. The saved
SQL is in [`db/schema.sql`](./db/schema.sql). The `members` table has a
`NOT NULL` constraint on `name`, a `UNIQUE` constraint on `email`, and a
generated UUID `DEFAULT` for `member_id`. `book_copies.copy_number` has a
`CHECK` constraint requiring a positive number. `borrow_requests.member_id`
is a foreign key to `members`.

For this design, each physical copy is recorded separately in `book_copies`;
the database does not store a total copy count on `books`. The positive
`copy_number` check prevents an invalid negative copy number, while the total
number of copies is counted from the rows.

I tested the constraints in DBeaver using inserts that PostgreSQL rejected:

```sql
-- NOT NULL
INSERT INTO members (name, email)
VALUES (NULL, 'constraint-null-test@example.com');
```

PostgreSQL reported:

```text
SQL Error [23502]: ERROR: null value in column "name" of relation "members" violates not-null constraint
Detail: Failing row contains (24e9c38f-bfe9-4d1b-a25b-9b2553c9a0aa, null, constraint-null-test@example.com, null, null).
```

```sql
-- UNIQUE
INSERT INTO members (name, email)
VALUES ('Duplicate Email Test', 'constraint-member@example.com');
```

PostgreSQL reported:

```text
SQL Error [23505]: ERROR: duplicate key value violates unique constraint "members_email_key"
Detail: Key (email)=(constraint-member@example.com) already exists.
```

```sql
-- CHECK
INSERT INTO book_copies (book_id, branch_id, copy_number)
VALUES (
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
    -1
);
```

PostgreSQL reported:

```text
SQL Error [23514]: ERROR: new row for relation "book_copies" violates check constraint "book_copies_copy_number_check"
Detail: Failing row contains (296c68f0-31ac-4359-a4fa-0d5df4be95a6, 22222222-2222-4222-8222-222222222222, 33333333-3333-4333-8333-333333333333, -1).
```

```sql
-- FOREIGN KEY
INSERT INTO borrow_requests (member_id, copy_id, borrowed_on, due_on)
VALUES (
    '99999999-9999-4999-8999-999999999999',
    '44444444-4444-4444-8444-444444444444',
    CURRENT_DATE,
    CURRENT_DATE + 7
);
```

PostgreSQL reported:

```text
SQL Error [23503]: ERROR: insert or update on table "borrow_requests" violates foreign key constraint "borrow_requests_member_id_fkey"
Detail: Key (member_id)=(99999999-9999-4999-8999-999999999999) is not present in table "members".
```

The `DEFAULT` is different: it supplies a value rather than rejecting an
insert. I omitted `member_id` and inserted a member:

```sql
INSERT INTO members (name, email)
VALUES ('Default Test Member', 'constraint-default@example.com');

SELECT member_id, name
FROM members
WHERE email = 'constraint-default@example.com';
```

The insert succeeded. DBeaver showed `Default Test Member` with generated
`member_id` `1260498e-8c6d-4aaa-89b1-eea4cf409af5`, proving the default works.

## Task 5

| Value | Type | Reason |
|---|---|---|
| Book title | `TEXT` | Titles can have different lengths. |
| Member email | `TEXT` | Email addresses are text, not numbers. |
| Number of copies | `INTEGER` | Copies are counted in whole numbers. In this design, each copy is a row in `book_copies`, so we count rows instead of storing a total on `books`. |
| Fine rate | `NUMERIC(6,2)` | Exact decimal arithmetic avoids floating-point rounding for money. |
| Borrowed date | `DATE` | It is a calendar date; no time of day is needed. |
| Record-created timestamp | `TIMESTAMPTZ` | It stores an instant and displays it in the session time zone. |
| Loan status | `TEXT` with a `CHECK` constraint | It stores a word and the check can limit it to valid statuses. |

I tried `SELECT 0.1 + 0.2;` in PostgreSQL and got `0.3`. PostgreSQL treats
these untyped decimal literals as exact `NUMERIC` values. I then tried
`SELECT 0.1::double precision + 0.2::double precision;` and got
`0.30000000000000004`. This small rounding difference is why a fine rate
should not use a floating-point type.

The time-zone query showed that the PostgreSQL session time zone is
`Asia/Karachi`. The current timestamp was displayed with a `+0500` offset,
and both `CURRENT_DATE` and the Karachi local date were `2026-10-12`.
PostgreSQL's `DATE` stores only a calendar date, with no time or time zone.
When PostgreSQL calculates `CURRENT_DATE`, it uses the session time zone;
`TIMESTAMPTZ` stores an instant and is displayed using that same session time
zone.

For these choices, a loan's daily fine rate should use `NUMERIC(6,2)`,
each physical copy number should use `INTEGER`, borrowing/due/return dates
should use `DATE`, a loan status can use `TEXT` with a check, and a
record-created timestamp should use `TIMESTAMPTZ`.

## Task 6

I chose a `TEXT` status column with a `CHECK` constraint for `borrow_requests`.
The allowed loan statuses are `out`, `overdue`, and `returned`; “on shelf”
describes a copy that is not currently borrowed, not a loan status. A new
loan defaults to `out`.

- A database `ENUM` would also restrict the values, but adding another status
  later requires changing the enum type.
- A lookup table with a foreign key is useful if statuses need extra details
  or need to be managed as data, but it adds a table and a join for this small
  fixed set.

If the library adds a fifth status next year, I would update the allowed
values in the `CHECK` constraint with a database migration and update the
application code to recognize the new status. The saved
[`db/schema.sql`](./db/schema.sql) now uses the text-and-check approach.

# Exercise 4 — One book, many copies, many members

## Task 1

I added `branch_id` to `members` as a required foreign key to `branches` and
assigned the existing test members to the test branch in PostgreSQL. The
foreign key goes in `members`, the “many” table: each member belongs to one
branch, while a branch can be referenced by many members.

## Task 2

I chose a separate `book_copies` row for every physical copy instead of
keeping a total count on `books`. A count would not show which branch a copy
is at, which specific copy a member borrowed, or the difference between a
copy that is available, missing, or withdrawn. With separate rows, each copy
has its own branch, copy number, inventory status, acquisition year and
method, and condition notes. A copy donated in 1998 can therefore be recorded
as a donation with its own condition notes, and a missing copy remains in the
database with its status set to `missing`.

The `borrow_requests.copy_id` foreign key identifies the particular copy
borrowed. The saved [`db/schema.sql`](./db/schema.sql) includes the copy
details and the status choices. I ran the `ALTER TABLE` in PostgreSQL and
DBeaver reported no error.

## Task 3

A foreign key in `books` could point to only one genre for each book, so it
could not represent a book with several genres. A foreign key in `genres`
could point to only one book for each genre, so it could not represent a
genre shared by many books. Putting multiple IDs in one column would also
prevent each relationship from being stored and checked as a separate value.

I created `book_genres` with `book_id` and `genre_id`, and `book_authors`
with `book_id` and `author_id`. In both tables, the two foreign keys together
are the primary key. This means the same book-genre or book-author pair
cannot appear twice. A separate ID column is not needed because the pair
already identifies each relationship.

The same junction-table design is needed for authors because a book can have
multiple authors and an author can write multiple books. The spreadsheet's
one-author-per-book layout cannot represent that relationship correctly. I
created all four tables in PostgreSQL, and DBeaver reported no errors.

## Task 4

`borrow_requests` connects one member to one physical copy, but unlike
`book_genres`, the connection has information of its own: when it was
borrowed, when it is due, whether it was returned, its status, and the fine
for that loan. `book_genres` only records that a book belongs to a genre; it
has no separate facts about that link. A relationship table that also stores
its own attributes is called an **associative entity** (or an associative
table).

## Task 5

The schema is in [`db/schema.sql`](./db/schema.sql). Compared with Exercise 2
Task 6, the design now includes a required branch for each member, separate
rows and condition/inventory details for copies, multiple authors per book,
and separate assessed fines and fine payments. The live database has also
been updated with the loan branch, fine fields, and `fine_payments` table.

The ERD matches the main relationships in the design. Creating it made the
links explicit: `borrow_requests` refers to one member and one copy, and the
two book junction tables connect books to multiple authors and genres.

## Task 6

I added [`db/seed.sql`](./db/seed.sql) and ran it successfully in PostgreSQL.
It demonstrates a book with two authors, a book with no author, a member
with no loans, five copies of Dune across two branches (including one marked
missing), an overdue loan, and a fine payment. The donated copy from 1998
also has condition notes. No schema change was needed.

# Exercise 5 — What happens when you delete a member

## Task 1

Deleting a member who has a loan failed with PostgreSQL error `23503`: the
`borrow_requests_member_id_fkey` constraint rejected the deletion because
the loan still refers to that member. The member was not deleted.

Deleting a branch that has a member also failed with PostgreSQL error
`23503`: the `members_branch_id_fkey` constraint rejected the deletion
because the member still refers to that branch. The branch was not deleted.

## Task 2

I predicted the four delete actions in [`guesses.md`](./guesses.md), then
tested each on temporary tables with three loans for the member:

- `CASCADE`: the member deletion succeeded and all three loan rows were
  deleted.
- `RESTRICT`: PostgreSQL rejected the deletion with error `23001` because
  loan rows still referenced the member.
- `SET NULL`: the member deletion succeeded; all three loan rows remained
  with `member_id` set to `NULL`.
- `NO ACTION`: PostgreSQL rejected the deletion with error `23503` because
  loan rows still referenced the member.

`RESTRICT` and `NO ACTION` both block a deletion while references remain.
The difference is that `NO ACTION` can be deferred until the end of a
transaction when its foreign-key constraint is declared deferrable;
`RESTRICT` checks immediately and cannot be deferred.

## Task 4

Without `ON UPDATE CASCADE`, changing a branch primary key from `1` to `2`
failed with PostgreSQL error `23503` because three members still referenced
branch `1`. With `ON UPDATE CASCADE` on a separate test relationship, the
same key change succeeded and all three members' `branch_id` values changed
to `2`.

This problem is uncommon when primary keys are generated IDs: they are
internal identifiers and normally never need to change. A natural key, such
as a branch name or other real-world value, is more likely to change and
cause this kind of update to be needed.

## Task 5

Members are soft-deleted by setting `is_active` to `FALSE`, which preserves
their loan history. This means member queries must filter active rows, email
uniqueness applies only to active members, and personal data remains until a
separate erasure process removes it. I tested reusing an inactive member's
email: the new active member was inserted successfully; rerunning the same
insert was rejected as a duplicate.

## Task 6

Use **pseudonymization**: replace identifying member details with neutral
values while retaining the member ID and loan records for statistics and
unpaid-fine tracking. On erasure, clear or replace `name`, `email`, and
`phone`; retain `member_id` for the foreign-key links and keep
`is_active = FALSE`. Keep `joined_on` only if it is still needed for
statistics and cannot identify the person on its own. The branch assignment
should also be removed or generalized if it could identify the member.

# Exercise 6 — Why is this query slow

## Task 1

I used PostgreSQL `generate_series` to insert 400,000 synthetic loan rows.
The `borrow_requests` table now contains 400,002 rows, including the two
earlier test/seed loans.

## Task 2

The overdue report returned one loan; DBeaver reported a fetch time of
0.046 seconds. `EXPLAIN` showed a `Parallel Seq Scan` on `borrow_requests`,
so PostgreSQL scans the loan table and applies the overdue filter. The plan
estimates `rows=1` for the scan output; the table contains 400,002 rows to
scan, not just one.

## Task 3

I added a partial index on `due_on` for loans where `returned_on IS NULL`.
The report still returned one row.

| Measurement | Before index | After index |
|---|---:|---:|
| DBeaver fetch time | 0.046 seconds | 0.006 seconds |
| Plan for `borrow_requests` | Parallel sequential scan | Index scan using `borrow_requests_overdue_due_on_idx` |
| Estimated matching rows | 1 | 1 |

An index is a separate, ordered structure that stores indexed values with
references to the matching table rows, so PostgreSQL can look up candidates
without checking every row. The exact timings can vary between runs.

## Task 4

For `WHERE status = 'overdue' ORDER BY due_on`, PostgreSQL used
`borrow_requests_status_due_on_idx`; the plan estimated cost `0.42..6.19`
and `rows=1`. When that index was temporarily removed, it used
`borrow_requests_due_on_status_idx`; the plan estimated cost
`0.42..4360.45` and `rows=1`. The first index is much cheaper for this query
because PostgreSQL can first narrow to the requested status, then read those
rows in due-date order.

**PUT THE COLUMNS YOU FILTER ON FIRST, THEN THE COLUMNS YOU SORT OR RANGE
OVER.** Column order matters in a composite index: the leading column
determines which rows the index can narrow down efficiently.

## Task 5

| Measurement | Before three additional indexes | After three additional indexes |
|---|---:|---:|
| 50,000-row insert time | 2.509 seconds | 2.401 seconds |

The measured times were very close; this run did not show a slowdown, and
small timing differences can come from normal system and cache variation.
The additional indexes were `borrow_requests_member_id_idx`,
`borrow_requests_copy_id_idx`, and `borrow_requests_branch_id_idx`.

**The database pays the index-maintenance cost on inserts, updates, and
deletes; on a write-heavy table, extra indexes can slow writes and consume
storage, so keep only indexes that justify those costs.**

## Task 6

### Indexes kept

`schema.sql` documents the query served by every index, including indexes
created automatically for primary-key and unique constraints. The capstone
index set is:

| Table | Indexed columns | Query served |
|---|---|---|
| `branches` | Primary key `branch_id` | Fetch a branch by ID. |
| `members` | Primary key `member_id` | Fetch a member by ID. |
| `members` | Unique partial index on `email` where `is_active = TRUE` | Find an active member by email and enforce unique active emails while allowing reuse after soft deletion. |
| `books` | Primary key `book_id` | Fetch a book by ID. |
| `books` | Unique `isbn` | Find a book by ISBN and prevent duplicate ISBNs. |
| `authors` | Primary key `author_id` | Fetch an author by ID. |
| `genres` | Primary key `genre_id` | Fetch a genre by ID. |
| `book_copies` | Primary key `copy_id` | Fetch a physical copy by ID. |
| `book_copies` | Unique `(book_id, branch_id, copy_number)` | Find/identify a numbered copy of a book at a branch and prevent duplicate copy numbers there. |
| `borrow_requests` | Primary key `loan_id` | Fetch a loan by ID. |
| `borrow_requests` | Partial `due_on` where `returned_on IS NULL` | Find unreturned past-due loans for the overdue report, ordered by due date. |
| `borrow_requests` | Composite `(status, due_on)` | Find loans of a given status ordered by due date. |
| `borrow_requests` | `member_id` | List a member's loans and check references when a member is deleted or its key changes. |
| `borrow_requests` | `copy_id` | Find a copy's loan records and check references when a copy is deleted or its key changes. |
| `borrow_requests` | `branch_id` | List loans for a branch and check references when a branch is deleted or its key changes. |
| `fine_payments` | Primary key `payment_id` | Fetch a fine payment by ID. |
| `fine_payments` | `loan_id` | List payments for a loan and check references when a loan is deleted or its key changes. |
| `book_genres` | Composite primary key `(book_id, genre_id)` | List a book's genres and prevent duplicate book/genre links. |
| `book_authors` | Composite primary key `(book_id, author_id)` | List a book's authors and prevent duplicate book/author links. |

### Indexes deliberately left out

I removed `(due_on, status)`: Task 4 showed it was substantially more
expensive than `(status, due_on)` for the tested status-filtered,
due-date-ordered query. It also adds index maintenance without serving a
distinct query in the current workload. I did not add reverse-order indexes
on `book_authors(author_id, book_id)` or `book_genres(genre_id, book_id)`;
the current capstone workload lists authors and genres starting from a book,
which the primary-key indexes already support. Add reverse indexes only if
searching books by author or genre becomes a measured, important query.

I also left out standalone indexes on low-cardinality fields such as
`borrow_requests.status` and `book_copies.inventory_status`: no demonstrated
query benefits enough from those alone to justify their write and storage
costs. The composite status/due-date index serves the tested status-and-sort
query instead.

### First table likely to become a bottleneck

`borrow_requests` is the table most likely to cause the first performance
problem: every borrowing and return adds or updates a row, and loans grow
continuously while reports and histories repeatedly query them. I would
first measure the slow query with `EXPLAIN (ANALYZE, BUFFERS)`, then add or
adjust an index for its actual filter, join, and ordering pattern. If the
table eventually becomes very large and time-based reports dominate, I would
evaluate partitioning by `borrowed_on` or `due_on`, but only after measuring
the operational and query costs.