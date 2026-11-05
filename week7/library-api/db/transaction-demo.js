// Exercise 5, Task 4: borrowing a book is two writes.
//   1. create the loan (a row in borrow_requests)
//   2. take one off the book's available_copies
// The second write is made to fail on purpose: available_copies is set to 0
// first, so taking one off breaks the CHECK (available_copies >= 0).
import prisma from "../src/db/prisma.js";

const COPY_ID = "f1000000-0000-4000-8000-000000000002"; // a Dune copy at Clifton

const copy = await prisma.book_copies.findUnique({ where: { copy_id: COPY_ID } });
const member = await prisma.members.findUnique({ where: { api_id: "m-test" } });

const borrowBook = async (db) => {
  await db.borrow_requests.create({
    data: {
      member_id: member.member_id,
      copy_id: copy.copy_id,
      branch_id: copy.branch_id,
      due_on: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: "out",
    },
  });

  await db.books.update({
    where: { book_id: copy.book_id },
    data: { available_copies: { decrement: 1 } },
  });
};

const showState = async (label) => {
  const openLoans = await prisma.borrow_requests.count({
    where: { copy_id: COPY_ID, returned_on: null },
  });
  const book = await prisma.books.findUnique({ where: { book_id: copy.book_id } });
  console.log(
    `${label}: open loans on this copy = ${openLoans}, available_copies = ${book.available_copies}`,
  );
};

const original = await prisma.books.findUnique({ where: { book_id: copy.book_id } });
await prisma.books.update({
  where: { book_id: copy.book_id },
  data: { available_copies: 0 },
});

// 1. Without a transaction
console.log("--- Without a transaction");
await showState("Before");
try {
  await borrowBook(prisma);
} catch (err) {
  console.log(`Second write failed: ${err.code} (Postgres ${err.meta?.driverAdapterError?.cause?.originalCode})`);
}
await showState("After");

// clean up the loan that was left behind
await prisma.borrow_requests.deleteMany({
  where: { copy_id: COPY_ID, returned_on: null, member_id: member.member_id },
});

// 2. With a transaction
console.log("--- With a transaction");
await showState("Before");
try {
  await prisma.$transaction(async (tx) => {
    await borrowBook(tx);
  });
} catch (err) {
  console.log(`Second write failed: ${err.code} (Postgres ${err.meta?.driverAdapterError?.cause?.originalCode})`);
}
await showState("After");

// put the count back
await prisma.books.update({
  where: { book_id: copy.book_id },
  data: { available_copies: original.available_copies },
});

await prisma.$disconnect();
