import { ApiError } from "../errors/ApiError.js";

// Load the member and the book together with the request, in the same call.
const include = { members: true, books: true };

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
    });
    if (!member) {
      throw notFoundField("userId");
    }
    row.member_id = member.member_id;
  }

  if (request.bookId !== undefined) {
    const book = await prisma.books.findFirst({
      where: { api_id: request.bookId, is_active: true },
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
      include,
      orderBy: { api_id: "asc" },
    });
    return rows.map(toBorrowRequest);
  },

  async findById(id) {
    const row = await prisma.book_requests.findUnique({
      where: { api_id: id },
      include,
    });
    return row ? toBorrowRequest(row) : null;
  },

  async create(requestData) {
    const row = await prisma.book_requests.create({
      data: await toRow(prisma, requestData),
      include,
    });
    return toBorrowRequest(row);
  },

  async updateById(id, changes) {
    const existing = await prisma.book_requests.findUnique({
      where: { api_id: id },
    });
    if (!existing) {
      return null;
    }

    const row = await prisma.book_requests.update({
      where: { request_id: existing.request_id },
      data: await toRow(prisma, changes),
      include,
    });
    return toBorrowRequest(row);
  },
});

export default createBorrowRequestsRepository;
