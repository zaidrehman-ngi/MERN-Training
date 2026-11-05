// Exercise 6, Task 2: the N+1 bug, on purpose.
// Run with DB_QUERY_LOG=true to see every query.
// It adds test borrow requests until there are 100; npm run db:seed removes them.
import prisma from "../src/db/prisma.js";

const existing = await prisma.book_requests.count();
if (existing < 100) {
  const members = await prisma.members.findMany({ where: { is_active: true } });
  const books = await prisma.books.findMany({ where: { is_active: true }, take: 50 });
  const rows = [];
  for (let i = 0; i < 100 - existing; i += 1) {
    rows.push({
      member_id: members[i % members.length].member_id,
      book_id: books[i % books.length].book_id,
      status: "pending",
    });
  }
  await prisma.book_requests.createMany({ data: rows });
}

console.log("----- the bug starts here");
const start = performance.now();

// 1 query for the list
const requests = await prisma.book_requests.findMany({ take: 100 });

// then 1 query for every row
const result = [];
for (const request of requests) {
  const member = await prisma.members.findUnique({
    where: { member_id: request.member_id },
  });
  result.push({ id: request.api_id, memberName: member.name });
}

const time = Math.round(performance.now() - start);
console.log(`----- done: ${result.length} borrow requests with member names in ${time}ms`);

// Exercise 6, Task 3: the fix. include loads the members together with the list.
console.log("----- the fix starts here");
const fixStart = performance.now();

const requestsWithMembers = await prisma.book_requests.findMany({
  take: 100,
  include: { members: true },
});
const fixed = requestsWithMembers.map((request) => ({
  id: request.api_id,
  memberName: request.members.name,
}));

const fixTime = Math.round(performance.now() - fixStart);
console.log(`----- done: ${fixed.length} borrow requests with member names in ${fixTime}ms`);

await prisma.$disconnect();
