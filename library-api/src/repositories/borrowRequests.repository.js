import { ApiError } from "../errors/ApiError.js";

// Only fetch the columns we actually send back.
const requestColumns = {
  api_id: true,
  status: true,
  requested_on: true,
  due_on: true,
  fine_per_day: true,
};

// The list only needs the member's name and the book's title.
const listSelect = {
  ...requestColumns,
  members: { select: { api_id: true, name: true } },
  books: { select: { api_id: true, title: true } },
};

// One borrow request gets a bit more about its member and book.
const detailSelect = {
  ...requestColumns,
  members: { select: { api_id: true, name: true, email: true } },
  books: { select: { api_id: true, title: true, author: true } },
};

const toDate = (date) => (date ? date.toISOString().slice(0, 10) : null);

// Same shape as db.json, plus the member and book objects.
const toBorrowRequest = (row) => ({
  id: row.api_id,
  bookId: row.books.api_id,
  userId: row.members.api_id,
  status: row.status,
  requestedAt: toDate(row.requested_on),
  dueDate: toDate(row.due_on),
  finePerDay: row.fine_per_day,
  member: {
    id: row.members.api_id,
    name: row.members.name,
    email: row.members.email,
  },
  book: {
    id: row.books.api_id,
    title: row.books.title,
    author: row.books.author,
  },
});

// For the list: just the name and title, nothing else per row.
const toListItem = (row) => ({
  id: row.api_id,
  bookId: row.books.api_id,
  userId: row.members.api_id,
  status: row.status,
  requestedAt: toDate(row.requested_on),
  dueDate: toDate(row.due_on),
  finePerDay: row.fine_per_day,
  memberName: row.members.name,
  bookTitle: row.books.title,
});

const notFoundField = (field) =>
  new ApiError("A related record does not exist.", 422, {
    code: "VALIDATION_ERROR",
    details: [{ field, message: "No record found with this id." }],
  });

// API field names -> column names. userId and bookId are the API ids
// (m-1000, bk-1), so look up the real rows first.
const toRow = async (prisma, request) => {
  const row = {
    status: request.status,
    requested_on: request.requestedAt
      ? new Date(request.requestedAt)
      : undefined,
    due_on: request.dueDate ? new Date(request.dueDate) : undefined,
    fine_per_day: request.finePerDay,
  };

  if (request.userId !== undefined) {
    const member = await prisma.members.findFirst({
      where: { api_id: request.userId, is_active: true },
      select: { member_id: true },
    });
    if (!member) {
      throw notFoundField("userId");
    }
    row.member_id = member.member_id;
  }

  if (request.bookId !== undefined) {
    const book = await prisma.books.findFirst({
      where: { api_id: request.bookId, is_active: true },
      select: { book_id: true },
    });
    if (!book) {
      throw notFoundField("bookId");
    }
    row.book_id = book.book_id;
  }

  return row;
};

const createBorrowRequestsRepository = (prisma) => ({
  async findAll({ userId, bookId, status }) {
    const where = {};

    if (userId) {
      where.members = { api_id: userId };
    }

    if (bookId) {
      where.books = { api_id: bookId };
    }

    if (status) {
      where.status = status;
    }

    const rows = await prisma.book_requests.findMany({
      where,
      select: listSelect,
      orderBy: { api_id: "asc" },
    });
    return rows.map(toListItem);
  },

  async findById(id) {
    const row = await prisma.book_requests.findUnique({
      where: { api_id: id },
      select: detailSelect,
    });
    return row ? toBorrowRequest(row) : null;
  },

  async create(requestData) {
    const row = await prisma.book_requests.create({
      data: await toRow(prisma, requestData),
      select: detailSelect,
    });
    return toBorrowRequest(row);
  },

  async updateById(id, changes) {
    const existing = await prisma.book_requests.findUnique({
      where: { api_id: id },
      select: { request_id: true },
    });
    if (!existing) {
      return null;
    }

    const row = await prisma.book_requests.update({
      where: { request_id: existing.request_id },
      data: await toRow(prisma, changes),
      select: detailSelect,
    });
    return toBorrowRequest(row);
  },

  // Requests that still count against the member: waiting or out on loan.
  countOpenForMember(memberId) {
    return prisma.book_requests.count({
      where: {
        members: { api_id: memberId },
        status: { in: ["pending", "approved"] },
      },
    });
  },
});

export default createBorrowRequestsRepository;
