// Exercise 4, Task 4: one query end to end through Prisma.
// Overdue notice (same as Exercise 2, Task 3).
import prisma from "../src/db/prisma.js";

const today = new Date();

const loans = await prisma.borrow_requests.findMany({
  where: {
    returned_on: null,
    due_on: { lt: today },
  },
  select: {
    due_on: true,
    members: { select: { name: true, email: true } },
    book_copies: { select: { books: { select: { title: true } } } },
    branches: { select: { name: true } },
  },
  orderBy: [{ due_on: "asc" }, { loan_id: "asc" }],
});

const notices = loans.map((loan) => ({
  memberName: loan.members.name,
  memberEmail: loan.members.email,
  bookTitle: loan.book_copies.books.title,
  branchName: loan.branches.name,
  dueOn: loan.due_on.toISOString().slice(0, 10),
  daysOverdue: Math.floor((today - loan.due_on) / (1000 * 60 * 60 * 24)),
}));

console.table(notices);

await prisma.$disconnect();
