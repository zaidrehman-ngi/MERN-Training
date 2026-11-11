// Test data for development and the Postman collection.
// Run with: npm run db:seed (after npx prisma migrate deploy)
//
// Safe to run again. It empties the API tables (books, members, borrow
// requests, notifications, tokens) and puts the rows below back. Branches stay.
import prisma from "../src/db/prisma.ts";
import { hashPassword } from "../src/utils/password.ts";
import config from "../src/config/config.ts";

if (config.nodeEnv === "production") {
  console.error("The seed resets test data. It must not run in production.");
  process.exit(1);
}

if (!config.allowSeed) {
  console.error("Set ALLOW_SEED=true in .env to reset the test data.");
  process.exit(1);
}

const books = [
  {
    title: "Dune",
    author: "Frank Herbert",
    year: 1965,
    isbn: "9780441013593",
    coverUrl: null,
    onShelf: 3,
    totalCopies: 5,
    finePerDay: 20,
    status: "available",
  },
  {
    title: "Neuromancer",
    author: "William Gibson",
    year: 1984,
    isbn: "9780441569595",
    coverUrl: null,
    onShelf: 0,
    totalCopies: 2,
    finePerDay: 20,
    status: "out",
  },
  {
    title: "Hyperion",
    author: "Dan Simmons",
    year: 1989,
    isbn: "9780553283686",
    coverUrl: null,
    onShelf: 2,
    totalCopies: 4,
    finePerDay: 20,
    status: "available",
  },
  {
    title: "Report on the Karachi Municipal Library, 1961",
    author: null,
    year: 1961,
    isbn: "9780000000001",
    coverUrl: null,
    onShelf: 1,
    totalCopies: 1,
    finePerDay: 20,
    status: "available",
  },
  {
    title: "Sindhi Folk Tales",
    author: "Compiled by the Sindh Cultural Board",
    year: 1978,
    isbn: "9780000000002",
    coverUrl: null,
    onShelf: 2,
    totalCopies: 2,
    finePerDay: 20,
    status: "available",
  },
  {
    title:
      "A Comprehensive and Illustrated Survey of the Coastal Flora of Sindh and Balochistan, With Notes on Seasonal Variation and an Appendix of Local Names in Six Languages",
    author: "M. A. Qureshi",
    year: 1994,
    isbn: "9780000000003",
    coverUrl: null,
    onShelf: 0,
    totalCopies: 1,
    finePerDay: 20,
    status: "out",
  },
  {
    title: "The Sea and the Salt",
    author: "Zubaida Kazmi",
    year: 2003,
    isbn: "9780000000004",
    coverUrl: null,
    onShelf: 4,
    totalCopies: 4,
    finePerDay: 20,
    status: "available",
  },
  {
    title: "Karachi: A Sketchbook",
    author: "Farida Batool",
    year: 2015,
    isbn: "9780000000005",
    coverUrl: null,
    onShelf: 1,
    totalCopies: 3,
    finePerDay: 20,
    status: "RESERVED_STACK",
  },
  {
    title: "Untitled donation, box 14",
    author: null,
    year: null,
    isbn: null,
    coverUrl: null,
    onShelf: 1,
    totalCopies: 1,
    finePerDay: null,
    status: "available",
  },
];

// test@lib.pk / test123 is the login the Postman collection uses (hashed
// when seeding). admin-test / LibraryAdminTest2026! is the admin the collection
// logs in as first (its "Setup" folder).
const members = [
  {
    name: "Aisha Khan",
    email: "aisha0@lib.pk",
    role: "admin",
    branch: "Clifton Branch",
    joined: "2018-01-15",
  },
  {
    name: "Omar Sethi",
    email: "omar1@lib.pk",
    role: "librarian",
    branch: "Saddar Branch",
    joined: "2019-02-15",
  },
  {
    name: "Zainab Qureshi",
    email: "zainab2@lib.pk",
    role: "librarian",
    branch: "Gulshan Branch",
    joined: "2020-03-15",
  },
  {
    name: "Bilal Memon",
    email: "bilal3@lib.pk",
    role: "librarian",
    branch: "Clifton Branch",
    joined: "2021-04-15",
  },
  {
    name: "Test User",
    email: "test@lib.pk",
    password: "test123",
    role: "user",
    branch: "Clifton Branch",
    joined: "2026-09-30",
  },
  {
    name: "Postman Test Admin",
    email: "admin-test@lib.pk",
    password: "LibraryAdminTest2026!",
    role: "super admin",
    branch: "Clifton Branch",
    joined: "2026-10-08",
  },
  {
    name: "Sara Malik",
    email: "sara.malik@lib.pk",
    password: "Library@2026",
    role: "user",
    branch: "Clifton Branch",
    joined: "2026-10-20",
  },
  {
    name: "Usman Tariq",
    email: "usman.tariq@lib.pk",
    password: "Library@2026",
    role: "user",
    branch: "Clifton Branch",
    joined: "2026-10-20",
  },
  {
    name: "Demo Admin",
    email: "admin@lib.pk",
    password: "Admin@2026",
    role: "admin",
    branch: "Clifton Branch",
    joined: "2026-11-04",
  },
  {
    name: "Demo Librarian",
    email: "librarian@lib.pk",
    password: "Librarian@2026",
    role: "librarian",
    branch: "Clifton Branch",
    joined: "2026-11-04",
  },
];

const borrowRequests = [
  {
    bookIsbn: "9780441013593",
    memberEmail: "aisha0@lib.pk",
    status: "pending",
    requestedAt: "2026-01-10",
    dueDate: "2026-01-20",
    finePerDay: 20,
  },
  {
    bookIsbn: "9780000000001",
    memberEmail: "omar1@lib.pk",
    status: "approved",
    requestedAt: "2026-02-11",
    dueDate: "2026-02-21",
    finePerDay: 20,
  },
  {
    bookIsbn: "9780000000004",
    memberEmail: "zainab2@lib.pk",
    status: "rejected",
    requestedAt: "2026-03-12",
    dueDate: "2026-03-22",
    finePerDay: 20,
  },
];

// 1. Clear the API tables, children first because they point at members and books.
await prisma.notifications.deleteMany({});
await prisma.refresh_tokens.deleteMany({});
await prisma.revoked_tokens.deleteMany({});
await prisma.borrow_requests.deleteMany({});
await prisma.members.deleteMany({});
await prisma.books.deleteMany({});

// 2. Put the test data back. The database gives every row its id.
const bookIds = new Map();
for (const book of books) {
  const row = await prisma.books.create({
    data: {
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      publication_year: book.year,
      cover_url: book.coverUrl,
      available_copies: book.onShelf,
      total_copies: book.totalCopies,
      fine_per_day: book.finePerDay,
      status: book.status,
    },
  });
  bookIds.set(book.isbn, row.book_id);
}

const memberIds = new Map();
for (const member of members) {
  const branch =
    (await prisma.branches.findFirst({ where: { name: member.branch } })) ??
    (await prisma.branches.create({ data: { name: member.branch } }));

  const row = await prisma.members.create({
    data: {
      name: member.name,
      email: member.email,
      password_hash: member.password
        ? await hashPassword(member.password)
        : null,
      role: member.role,
      branch_id: branch.branch_id,
      joined_on: new Date(member.joined),
    },
  });
  memberIds.set(member.email, row.member_id);
}

for (const request of borrowRequests) {
  await prisma.borrow_requests.create({
    data: {
      member_id: memberIds.get(request.memberEmail),
      book_id: bookIds.get(request.bookIsbn),
      status: request.status,
      requested_on: new Date(request.requestedAt),
      due_on: new Date(request.dueDate),
      fine_per_day: request.finePerDay,
    },
  });
}

console.log(
  `Seeded ${books.length} books, ${members.length} members and ${borrowRequests.length} borrow requests.`,
);

await prisma.$disconnect();
