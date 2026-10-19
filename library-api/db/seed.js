// Test data for development and the Postman collection.
// Run with: npm run db:seed (after npx prisma migrate deploy)
//
// Safe to run again. It removes anything that was created through the API
// (anything that got its id from a sequence: bk-1000+, m-5000+, br-1000+, as
// long as nothing else points at it) and puts the rows below back the way
// they are here. Other data in the database is left alone.
import prisma from "../src/db/prisma.js";
import { hashPassword } from "../src/utils/password.js";

const books = [
  { id: "bk-1", title: "Dune", author: "Frank Herbert", year: 1965, isbn: "9780441013593", coverUrl: "/uploads/dune.jpg", onShelf: 3, totalCopies: 5, finePerDay: 20, status: "available" },
  { id: "bk-2", title: "Neuromancer", author: "William Gibson", year: 1984, isbn: "9780441569595", coverUrl: "/covers/neuromancer.jpg", onShelf: 0, totalCopies: 2, finePerDay: 20, status: "out" },
  { id: "bk-3", title: "Hyperion", author: "Dan Simmons", year: 1989, isbn: "9780553283686", coverUrl: "/covers/hyperion.jpg", onShelf: 2, totalCopies: 4, finePerDay: 20, status: "available" },
  { id: "bk-4", title: "Report on the Karachi Municipal Library, 1961", author: null, year: 1961, isbn: "9780000000001", coverUrl: "/covers/report-1961.jpg", onShelf: 1, totalCopies: 1, finePerDay: 20, status: "available" },
  { id: "bk-5", title: "Sindhi Folk Tales", author: "Compiled by the Sindh Cultural Board", year: 1978, isbn: "9780000000002", coverUrl: null, onShelf: 2, totalCopies: 2, finePerDay: 20, status: "available" },
  { id: "bk-6", title: "A Comprehensive and Illustrated Survey of the Coastal Flora of Sindh and Balochistan, With Notes on Seasonal Variation and an Appendix of Local Names in Six Languages", author: "M. A. Qureshi", year: 1994, isbn: "9780000000003", coverUrl: "/covers/flora.jpg", onShelf: 0, totalCopies: 1, finePerDay: 20, status: "out" },
  { id: "bk-7", title: "The Sea and the Salt", author: "Zubaida Kazmi", year: 2003, isbn: "9780000000004", coverUrl: "/covers/sea-salt.jpg", onShelf: 4, totalCopies: 4, finePerDay: 20, status: "available" },
  { id: "bk-8", title: "Karachi: A Sketchbook", author: "Farida Batool", year: 2015, isbn: "9780000000005", coverUrl: "/covers/sketchbook.jpg", onShelf: 1, totalCopies: 3, finePerDay: 20, status: "RESERVED_STACK" },
  { id: "bk-9", title: "Untitled donation, box 14", author: null, year: null, isbn: null, coverUrl: null, onShelf: 1, totalCopies: 1, finePerDay: null, status: "available" },
];

// test@lib.pk / test123 is the login the Postman collection uses (hashed
// when seeding). admin-test keeps the hash it already had in Week 5.
const members = [
  { id: "m-1000", name: "Aisha Khan", email: "aisha0@lib.pk", role: "admin", branch: "Clifton Branch", joined: "2018-01-15" },
  { id: "m-1001", name: "Omar Sethi", email: "omar1@lib.pk", role: "librarian", branch: "Saddar Branch", joined: "2019-02-15" },
  { id: "m-1002", name: "Zainab Qureshi", email: "zainab2@lib.pk", role: "librarian", branch: "Gulshan Branch", joined: "2020-03-15" },
  { id: "m-1003", name: "Bilal Memon", email: "bilal3@lib.pk", role: "librarian", branch: "Clifton Branch", joined: "2021-04-15" },
  { id: "m-test", name: "Test User", email: "test@lib.pk", password: "test123", role: "user", branch: "Clifton Branch", joined: "2026-09-30" },
  { id: "m-admin-test", name: "Postman Test Admin", email: "admin-test@lib.pk", passwordHash: "$2b$12$4UlWWwiq4v5LcFRNS4QjluTp56s4.ahaQ9.mJd75DwqKTjFel3OUG", role: "admin", branch: "Clifton Branch", joined: "2026-10-08" },
];

const borrowRequests = [
  { id: "br-100", bookId: "bk-1", userId: "m-1000", status: "pending", requestedAt: "2026-01-10", dueDate: "2026-01-20", finePerDay: 20 },
  { id: "br-101", bookId: "bk-4", userId: "m-1001", status: "approved", requestedAt: "2026-02-11", dueDate: "2026-02-21", finePerDay: 20 },
  { id: "br-102", bookId: "bk-7", userId: "m-1002", status: "rejected", requestedAt: "2026-03-12", dueDate: "2026-03-22", finePerDay: 20 },
];

// ids like bk-1004 or m-5001 came from the sequences, so the API made them
const madeByApi = (apiId, start) => {
  const number = Number(apiId.split("-")[1]);
  return Number.isInteger(number) && number >= start;
};

// 1. Remove what the API created, requests first because they point at
//    members and books.
const requests = await prisma.book_requests.findMany({ select: { request_id: true, api_id: true } });
await prisma.book_requests.deleteMany({
  where: {
    request_id: { in: requests.filter((r) => madeByApi(r.api_id, 1000)).map((r) => r.request_id) },
  },
});

const memberRows = await prisma.members.findMany({
  where: { borrow_requests: { none: {} }, book_requests: { none: {} } },
  select: { member_id: true, api_id: true },
});
await prisma.members.deleteMany({
  where: {
    member_id: { in: memberRows.filter((m) => madeByApi(m.api_id, 5000)).map((m) => m.member_id) },
  },
});

const bookRows = await prisma.books.findMany({
  where: {
    book_copies: { none: {} },
    book_authors: { none: {} },
    book_genres: { none: {} },
    book_requests: { none: {} },
  },
  select: { book_id: true, api_id: true },
});
await prisma.books.deleteMany({
  where: {
    book_id: { in: bookRows.filter((b) => madeByApi(b.api_id, 1000)).map((b) => b.book_id) },
  },
});

// 2. Put the test data back.
for (const book of books) {
  const data = {
    api_id: book.id,
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    publication_year: book.year,
    cover_url: book.coverUrl,
    available_copies: book.onShelf,
    total_copies: book.totalCopies,
    fine_per_day: book.finePerDay,
    status: book.status,
    is_active: true,
  };

  // Dune was already in my database from Tuesday, so match it by ISBN too
  const existing =
    (await prisma.books.findUnique({ where: { api_id: book.id } })) ??
    (book.isbn ? await prisma.books.findFirst({ where: { isbn: book.isbn } }) : null);

  if (existing) {
    await prisma.books.update({ where: { book_id: existing.book_id }, data });
  } else {
    await prisma.books.create({ data });
  }
}

for (const member of members) {
  const branch =
    (await prisma.branches.findFirst({ where: { name: member.branch } })) ??
    (await prisma.branches.create({ data: { name: member.branch } }));

  const data = {
    api_id: member.id,
    name: member.name,
    email: member.email,
    password_hash: member.password
      ? await hashPassword(member.password)
      : (member.passwordHash ?? null),
    role: member.role,
    branch_id: branch.branch_id,
    joined_on: new Date(member.joined),
    is_active: true,
  };
  await prisma.members.upsert({ where: { api_id: member.id }, update: data, create: data });
}

for (const request of borrowRequests) {
  const member = await prisma.members.findUnique({ where: { api_id: request.userId } });
  const book = await prisma.books.findUnique({ where: { api_id: request.bookId } });
  const data = {
    api_id: request.id,
    member_id: member.member_id,
    book_id: book.book_id,
    status: request.status,
    requested_on: new Date(request.requestedAt),
    due_on: new Date(request.dueDate),
    fine_per_day: request.finePerDay,
  };
  await prisma.book_requests.upsert({ where: { api_id: request.id }, update: data, create: data });
}

console.log(
  `Seeded ${books.length} books, ${members.length} members and ${borrowRequests.length} borrow requests.`,
);

await prisma.$disconnect();
