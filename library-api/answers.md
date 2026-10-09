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