// Exercise 6, Task 4: the ten most recent borrow requests with their member
// and book. One query with two joins vs three flat queries stitched in JS.
import prisma from "../src/db/prisma.js";

// A: one query, two joins
const withJoins = () => prisma.$queryRaw`
  SELECT r.api_id, r.requested_on, m.name AS member_name, b.title AS book_title
  FROM book_requests AS r
  JOIN members AS m ON m.member_id = r.member_id
  JOIN books AS b ON b.book_id = r.book_id
  ORDER BY r.requested_on DESC, r.api_id
  LIMIT 10
`;

// B: three flat queries, then match them up in JavaScript
const withThreeQueries = async () => {
  const requests = await prisma.book_requests.findMany({
    orderBy: [{ requested_on: "desc" }, { api_id: "asc" }],
    take: 10,
  });
  const members = await prisma.members.findMany({
    where: { member_id: { in: requests.map((r) => r.member_id) } },
  });
  const books = await prisma.books.findMany({
    where: { book_id: { in: requests.map((r) => r.book_id) } },
  });

  const memberById = new Map(members.map((m) => [m.member_id, m]));
  const bookById = new Map(books.map((b) => [b.book_id, b]));

  return requests.map((r) => ({
    api_id: r.api_id,
    requested_on: r.requested_on,
    member_name: memberById.get(r.member_id).name,
    book_title: bookById.get(r.book_id).title,
  }));
};

const time = async (label, fn, runs = 500) => {
  for (let i = 0; i < 20; i += 1) await fn(); // warm up first

  const times = [];
  for (let i = 0; i < runs; i += 1) {
    const start = performance.now();
    await fn();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  const average = times.reduce((sum, t) => sum + t, 0) / runs;
  const median = times[Math.floor(runs / 2)];
  console.log(`${label}: average ${average.toFixed(2)} ms, median ${median.toFixed(2)} ms (${runs} runs)`);
};

// check both give the same 10 rows first
const a = await withJoins();
const b = await withThreeQueries();
const same = a.every((row, i) =>
  row.api_id === b[i].api_id &&
  row.member_name === b[i].member_name &&
  row.book_title === b[i].book_title,
);
console.log(`Same 10 rows from both: ${same}`);

await time("One query, two joins     ", withJoins);
await time("Three queries + stitch JS", withThreeQueries);

await prisma.$disconnect();
