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