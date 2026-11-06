import type { Prisma } from "../generated/prisma/client.ts";
import { NotFoundError } from "../errors/domainErrors.ts";
import translateDbError from "./dbErrors.ts";
import type { Repository } from "./repository.ts";
import type {
  BorrowRequest,
  BorrowRequestChanges,
  BorrowRequestListItem,
  BorrowRequestQuery,
  BorrowRequestStatus,
  NewBorrowRequest,
} from "../types/borrowRequest.ts";
import { BORROW_REQUEST_STATUSES } from "../types/borrowRequest.ts";

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
  findQueue(bookId: string): Promise<BorrowRequest[]>;
  updateIfStatus(
    id: string,
    from: BorrowRequestStatus[],
    changes: BorrowRequestChanges,
  ): Promise<BorrowRequest | null>;
  claimNextInQueue(
    bookId: string,
    holdUntil: string,
  ): Promise<BorrowRequest | null>;
  countAheadInQueue(
    bookId: string,
    queuedAt: string,
    id: string,
  ): Promise<number>;
  findExpiredHolds(today: string): Promise<BorrowRequest[]>;
}

const requestColumns = {
  api_id: true,
  status: true,
  requested_on: true,
  due_on: true,
  queued_at: true,
  hold_until: true,
  fine_per_day: true,
  returned_at: true,
  fine: true,
} satisfies Prisma.book_requestsSelect;

const listSelect = {
  ...requestColumns,
  members: { select: { api_id: true, name: true } },
  books: { select: { api_id: true, title: true } },
} satisfies Prisma.book_requestsSelect;

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
  const status = BORROW_REQUEST_STATUSES.find((known) => known === value);
  if (status) {
    return status;
  }
  throw new Error(`Unknown borrow request status in the database: ${value}`);
};

const toBorrowRequest = (row: DetailRow): BorrowRequest => ({
  id: row.api_id,
  bookId: row.books.api_id,
  userId: row.members.api_id,
  status: toStatus(row.status),
  requestedAt: toDate(row.requested_on),
  dueDate: toDate(row.due_on),
  queuedAt: row.queued_at ? row.queued_at.toISOString() : null,
  holdUntil: toDate(row.hold_until),
  finePerDay: row.fine_per_day,
  returnedAt: row.returned_at ? row.returned_at.toISOString() : null,
  fine: row.fine,
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

const toListItem = (row: ListRow): BorrowRequestListItem => ({
  id: row.api_id,
  bookId: row.books.api_id,
  userId: row.members.api_id,
  status: toStatus(row.status),
  requestedAt: toDate(row.requested_on),
  dueDate: toDate(row.due_on),
  queuedAt: row.queued_at ? row.queued_at.toISOString() : null,
  holdUntil: toDate(row.hold_until),
  finePerDay: row.fine_per_day,
  returnedAt: row.returned_at ? row.returned_at.toISOString() : null,
  fine: row.fine,
  memberName: row.members.name,
  bookTitle: row.books.title,
});

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

// userId and bookId are API ids (m-1000, bk-1), so look up the real rows
const toUpdateRow = async (
  prisma: Db,
  changes: BorrowRequestChanges,
): Promise<Prisma.book_requestsUncheckedUpdateInput> => {
  const row: Prisma.book_requestsUncheckedUpdateInput = {};
  if (changes.status !== undefined) row.status = changes.status;
  if (changes.requestedAt !== undefined) {
    row.requested_on = new Date(changes.requestedAt);
  }
  if (changes.queuedAt !== undefined) {
    row.queued_at =
      changes.queuedAt === null ? null : new Date(changes.queuedAt);
  }
  if (changes.holdUntil !== undefined) {
    row.hold_until =
      changes.holdUntil === null ? null : new Date(changes.holdUntil);
  }
  if (changes.dueDate !== undefined) {
    row.due_on = changes.dueDate === null ? null : new Date(changes.dueDate);
  }
  if (changes.finePerDay !== undefined) row.fine_per_day = changes.finePerDay;
  if (changes.returnedAt !== undefined) {
    row.returned_at =
      changes.returnedAt === null ? null : new Date(changes.returnedAt);
  }
  if (changes.fine !== undefined) row.fine = changes.fine;
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
      queued_at:
        requestData.queuedAt === null ? null : new Date(requestData.queuedAt),
      hold_until:
        requestData.holdUntil === null ? null : new Date(requestData.holdUntil),
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

  async updateIfStatus(id, from, changes) {
    const data = await toUpdateRow(prisma, changes);
    try {
      const result = await prisma.book_requests.updateMany({
        where: { api_id: id, status: { in: from } },
        data,
      });
      if (result.count === 0) {
        return null;
      }
    } catch (err) {
      throw translateDbError(err);
    }
    return this.findById(id);
  },

  async claimNextInQueue(bookId, holdUntil) {
    const rows = await prisma.$queryRaw<{ api_id: string }[]>`
      UPDATE book_requests
      SET status = 'held', hold_until = ${holdUntil}::date
      WHERE request_id = (
        SELECT r.request_id
        FROM book_requests r
        JOIN books b ON b.book_id = r.book_id
        WHERE b.api_id = ${bookId} AND r.status = 'queued'
        ORDER BY r.queued_at, r.api_id
        LIMIT 1
        FOR UPDATE OF r SKIP LOCKED
      )
      RETURNING api_id`;
    const claimed = rows[0];
    return claimed ? this.findById(claimed.api_id) : null;
  },

  async findQueue(bookId) {
    const rows = await prisma.book_requests.findMany({
      where: { status: "queued", books: { api_id: bookId } },
      select: detailSelect,
      orderBy: [{ queued_at: "asc" }, { api_id: "asc" }],
    });
    return rows.map(toBorrowRequest);
  },

  // same order as findQueue and claimNextInQueue: queued_at, then api_id for a tie
  countAheadInQueue(bookId, queuedAt, id) {
    const at = new Date(queuedAt);
    return prisma.book_requests.count({
      where: {
        status: "queued",
        books: { api_id: bookId },
        OR: [{ queued_at: { lt: at } }, { queued_at: at, api_id: { lt: id } }],
      },
    });
  },

  async findExpiredHolds(today) {
    const rows = await prisma.book_requests.findMany({
      where: { status: "held", hold_until: { lt: new Date(today) } },
      select: detailSelect,
      orderBy: { hold_until: "asc" },
    });
    return rows.map(toBorrowRequest);
  },
});

export default createBorrowRequestsRepository;
