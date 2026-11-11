import type { Prisma } from "../generated/prisma/client.ts";
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
  request_id: true,
  member_id: true,
  book_id: true,
  status: true,
  requested_on: true,
  due_on: true,
  queued_at: true,
  hold_until: true,
  fine_per_day: true,
  returned_at: true,
  fine: true,
} satisfies Prisma.borrow_requestsSelect;

const listSelect = {
  ...requestColumns,
  members: { select: { name: true } },
  books: { select: { title: true } },
} satisfies Prisma.borrow_requestsSelect;

const detailSelect = {
  ...requestColumns,
  members: { select: { name: true, email: true } },
  books: { select: { title: true, author: true } },
} satisfies Prisma.borrow_requestsSelect;

type ListRow = Prisma.borrow_requestsGetPayload<{ select: typeof listSelect }>;
type DetailRow = Prisma.borrow_requestsGetPayload<{
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
  id: row.request_id,
  bookId: row.book_id,
  userId: row.member_id,
  status: toStatus(row.status),
  requestedAt: toDate(row.requested_on),
  dueDate: toDate(row.due_on),
  queuedAt: row.queued_at ? row.queued_at.toISOString() : null,
  holdUntil: toDate(row.hold_until),
  finePerDay: row.fine_per_day,
  returnedAt: row.returned_at ? row.returned_at.toISOString() : null,
  fine: row.fine,
  member: {
    id: row.member_id,
    name: row.members.name,
    email: row.members.email,
  },
  book: {
    id: row.book_id,
    title: row.books.title,
    author: row.books.author,
  },
});

const toListItem = (row: ListRow): BorrowRequestListItem => ({
  id: row.request_id,
  bookId: row.book_id,
  userId: row.member_id,
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

const toUpdateRow = (
  changes: BorrowRequestChanges,
): Prisma.borrow_requestsUncheckedUpdateInput => {
  const row: Prisma.borrow_requestsUncheckedUpdateInput = {};
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
  if (changes.userId !== undefined) row.member_id = changes.userId;
  if (changes.bookId !== undefined) row.book_id = changes.bookId;
  return row;
};

const createBorrowRequestsRepository = (
  prisma: Db,
): BorrowRequestsRepository => ({
  async findAll({ userId, bookId, status, page, limit }) {
    const where: Prisma.borrow_requestsWhereInput = {};

    if (userId) {
      where.member_id = userId;
    }

    if (bookId) {
      where.book_id = bookId;
    }

    if (status) {
      where.status = status;
    }

    const rows = await prisma.borrow_requests.findMany({
      where,
      select: listSelect,
      orderBy: [{ requested_on: "asc" }, { request_id: "asc" }],
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
    });
    return rows.map(toListItem);
  },

  async findById(id) {
    const row = await prisma.borrow_requests.findUnique({
      where: { request_id: id },
      select: detailSelect,
    });
    return row ? toBorrowRequest(row) : null;
  },

  async create(requestData) {
    const data: Prisma.borrow_requestsUncheckedCreateInput = {
      member_id: requestData.userId,
      book_id: requestData.bookId,
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
      const row = await prisma.borrow_requests.create({
        data,
        select: detailSelect,
      });
      return toBorrowRequest(row);
    } catch (err) {
      throw translateDbError(err);
    }
  },

  async updateById(id, changes) {
    const existing = await prisma.borrow_requests.findUnique({
      where: { request_id: id },
      select: { request_id: true },
    });
    if (!existing) {
      return null;
    }

    try {
      const row = await prisma.borrow_requests.update({
        where: { request_id: id },
        data: toUpdateRow(changes),
        select: detailSelect,
      });
      return toBorrowRequest(row);
    } catch (err) {
      throw translateDbError(err);
    }
  },

  countForMember(memberId, statuses) {
    return prisma.borrow_requests.count({
      where: {
        member_id: memberId,
        status: { in: statuses },
      },
    });
  },

  async findOverdue(today) {
    const rows = await prisma.borrow_requests.findMany({
      where: { status: "approved", due_on: { lt: new Date(today) } },
      select: detailSelect,
      orderBy: { due_on: "asc" },
    });
    return rows.map(toBorrowRequest);
  },

  async findDueOn(date) {
    const rows = await prisma.borrow_requests.findMany({
      where: { status: "approved", due_on: new Date(date) },
      select: detailSelect,
      orderBy: { request_id: "asc" },
    });
    return rows.map(toBorrowRequest);
  },

  async updateIfStatus(id, from, changes) {
    try {
      const result = await prisma.borrow_requests.updateMany({
        where: { request_id: id, status: { in: from } },
        data: toUpdateRow(changes),
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
    const rows = await prisma.$queryRaw<{ request_id: string }[]>`
      UPDATE borrow_requests
      SET status = 'held', hold_until = ${holdUntil}::date
      WHERE request_id = (
        SELECT request_id
        FROM borrow_requests
        WHERE book_id = ${bookId}::uuid AND status = 'queued'
        ORDER BY queued_at, request_id
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING request_id`;
    const claimed = rows[0];
    return claimed ? this.findById(claimed.request_id) : null;
  },

  async findQueue(bookId) {
    const rows = await prisma.borrow_requests.findMany({
      where: { status: "queued", book_id: bookId },
      select: detailSelect,
      orderBy: [{ queued_at: "asc" }, { request_id: "asc" }],
    });
    return rows.map(toBorrowRequest);
  },

  // same order as findQueue and claimNextInQueue: queued_at, then request_id for a tie
  countAheadInQueue(bookId, queuedAt, id) {
    const at = new Date(queuedAt);
    return prisma.borrow_requests.count({
      where: {
        status: "queued",
        book_id: bookId,
        OR: [
          { queued_at: { lt: at } },
          { queued_at: at, request_id: { lt: id } },
        ],
      },
    });
  },

  async findExpiredHolds(today) {
    const rows = await prisma.borrow_requests.findMany({
      where: { status: "held", hold_until: { lt: new Date(today) } },
      select: detailSelect,
      orderBy: { hold_until: "asc" },
    });
    return rows.map(toBorrowRequest);
  },
});

export default createBorrowRequestsRepository;
