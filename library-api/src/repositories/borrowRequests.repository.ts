import type { Prisma } from "../generated/prisma/client.ts";
import { NotFoundError } from "../errors/domainErrors.js";
import translateDbError from "./dbErrors.js";
import type { Repository } from "./repository.ts";
import type {
  BorrowRequest,
  BorrowRequestChanges,
  BorrowRequestListItem,
  BorrowRequestQuery,
  BorrowRequestStatus,
  NewBorrowRequest,
} from "../types/borrowRequest.ts";

type Db = Prisma.TransactionClient;

export interface BorrowRequestsRepository extends Repository<
  BorrowRequest,
  NewBorrowRequest,
  BorrowRequestQuery,
  BorrowRequestListItem
> {
  countForMember(
    memberId: string,
    statuses: BorrowRequestStatus[],
  ): Promise<number>;
  findOverdue(today: string): Promise<BorrowRequest[]>;
  findDueOn(date: string): Promise<BorrowRequest[]>;
}

// Only fetch the columns we actually send back.
const requestColumns = {
  api_id: true,
  status: true,
  requested_on: true,
  due_on: true,
  fine_per_day: true,
} satisfies Prisma.book_requestsSelect;

// The list only needs the member's name and the book's title.
const listSelect = {
  ...requestColumns,
  members: { select: { api_id: true, name: true } },
  books: { select: { api_id: true, title: true } },
} satisfies Prisma.book_requestsSelect;

// One borrow request gets a bit more about its member and book.
const detailSelect = {
  ...requestColumns,
  members: { select: { api_id: true, name: true, email: true } },
  books: { select: { api_id: true, title: true, author: true } },
} satisfies Prisma.book_requestsSelect;

type ListRow = Prisma.book_requestsGetPayload<{ select: typeof listSelect }>;
type DetailRow = Prisma.book_requestsGetPayload<{
  select: typeof detailSelect;
}>;

const toDate = (date: Date | null): string | null =>
  date ? date.toISOString().slice(0, 10) : null;

const toStatus = (value: string): BorrowRequestStatus => {
  if (
    value === "pending" ||
    value === "approved" ||
    value === "rejected" ||
    value === "returned"
  ) {
    return value;
  }
  throw new Error(`Unknown borrow request status in the database: ${value}`);
};

// Same shape as db.json, plus the member and book objects.
const toBorrowRequest = (row: DetailRow): BorrowRequest => ({
  id: row.api_id,
  bookId: row.books.api_id,
  userId: row.members.api_id,
  status: toStatus(row.status),
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
const toListItem = (row: ListRow): BorrowRequestListItem => ({
  id: row.api_id,
  bookId: row.books.api_id,
  userId: row.members.api_id,
  status: toStatus(row.status),
  requestedAt: toDate(row.requested_on),
  dueDate: toDate(row.due_on),
  finePerDay: row.fine_per_day,
  memberName: row.members.name,
  bookTitle: row.books.title,
});

// no status code here, the error handler decides that
const notFoundField = (field: string) =>
  new NotFoundError("A related record does not exist.", {
    details: [{ field, message: "No record found with this id." }],
  });

const findMemberId = async (prisma: Db, apiId: string): Promise<string> => {
  const member = await prisma.members.findFirst({
    where: { api_id: apiId, is_active: true },
    select: { member_id: true },
  });
  if (!member) {
    throw notFoundField("userId");
  }
  return member.member_id;
};

const findBookId = async (prisma: Db, apiId: string): Promise<string> => {
  const book = await prisma.books.findFirst({
    where: { api_id: apiId, is_active: true },
    select: { book_id: true },
  });
  if (!book) {
    throw notFoundField("bookId");
  }
  return book.book_id;
};

// API field names -> column names. userId and bookId are the API ids
// (m-1000, bk-1), so look up the real rows first.
const toUpdateRow = async (
  prisma: Db,
  changes: BorrowRequestChanges,
): Promise<Prisma.book_requestsUncheckedUpdateInput> => {
  const row: Prisma.book_requestsUncheckedUpdateInput = {};
  if (changes.status !== undefined) row.status = changes.status;
  if (changes.requestedAt !== undefined) {
    row.requested_on = new Date(changes.requestedAt);
  }
  if (changes.dueDate !== undefined) {
    row.due_on = changes.dueDate === null ? null : new Date(changes.dueDate);
  }
  if (changes.finePerDay !== undefined) row.fine_per_day = changes.finePerDay;
  if (changes.userId !== undefined) {
    row.member_id = await findMemberId(prisma, changes.userId);
  }
  if (changes.bookId !== undefined) {
    row.book_id = await findBookId(prisma, changes.bookId);
  }
  return row;
};

const createBorrowRequestsRepository = (
  prisma: Db,
): BorrowRequestsRepository => ({
  async findAll({ userId, bookId, status, page, limit }) {
    const where: Prisma.book_requestsWhereInput = {};

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
      // no page given: the whole list, like before
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
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
    const data: Prisma.book_requestsUncheckedCreateInput = {
      member_id: await findMemberId(prisma, requestData.userId),
      book_id: await findBookId(prisma, requestData.bookId),
      status: requestData.status,
      requested_on: new Date(requestData.requestedAt),
      due_on:
        requestData.dueDate === null ? null : new Date(requestData.dueDate),
      fine_per_day: requestData.finePerDay,
    };
    try {
      const row = await prisma.book_requests.create({
        data,
        select: detailSelect,
      });
      return toBorrowRequest(row);
    } catch (err) {
      throw translateDbError(err);
    }
  },

  async updateById(id, changes) {
    const existing = await prisma.book_requests.findUnique({
      where: { api_id: id },
      select: { request_id: true },
    });
    if (!existing) {
      return null;
    }

    const data = await toUpdateRow(prisma, changes);
    try {
      const row = await prisma.book_requests.update({
        where: { request_id: existing.request_id },
        data,
        select: detailSelect,
      });
      return toBorrowRequest(row);
    } catch (err) {
      throw translateDbError(err);
    }
  },

  countForMember(memberId, statuses) {
    return prisma.book_requests.count({
      where: {
        members: { api_id: memberId },
        status: { in: statuses },
      },
    });
  },

  async findOverdue(today) {
    const rows = await prisma.book_requests.findMany({
      where: { status: "approved", due_on: { lt: new Date(today) } },
      select: detailSelect,
      orderBy: { due_on: "asc" },
    });
    return rows.map(toBorrowRequest);
  },

  async findDueOn(date) {
    const rows = await prisma.book_requests.findMany({
      where: { status: "approved", due_on: new Date(date) },
      select: detailSelect,
      orderBy: { api_id: "asc" },
    });
    return rows.map(toBorrowRequest);
  },
});

export default createBorrowRequestsRepository;
