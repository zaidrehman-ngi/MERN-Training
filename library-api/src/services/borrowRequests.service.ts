import {
  BorrowLimitReachedError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../errors/domainErrors.ts";
import { DOMAIN_EVENTS } from "../events/domainEvents.ts";
import type { Book } from "../types/book.ts";
import type {
  BorrowRequest,
  BorrowRequestChanges,
  BorrowRequestListItem,
  BorrowRequestQuery,
  BorrowRequestStatus,
} from "../types/borrowRequest.ts";
import type { BorrowRequestsRepository } from "../repositories/borrowRequests.repository.ts";
import type { NotificationsRepository } from "../repositories/notifications.repository.ts";
import type { Actor } from "../types/member.ts";
import type { Events } from "../types/events.ts";
import { addDays, todayIn } from "../utils/dates.ts";
import { calculateFine } from "./fines.ts";

type BooksService = {
  getById(id: string): Promise<Book>;
  changeAvailability(id: string, change: number): Promise<Book>;
};

type UsersService = {
  getById(id: string): Promise<unknown>;
};

export type Tx = {
  services: { books: BooksService; borrowRequests: BorrowRequestsService };
  repositories: {
    borrowRequests: BorrowRequestsRepository;
    notifications: NotificationsRepository;
  };
  events: Events;
};

export type Transaction = <T>(work: (tx: Tx) => Promise<T>) => Promise<T>;

export type QueuePosition = {
  id: string;
  bookId: string;
  status: BorrowRequestStatus;
  position: number | null;
};

export type HoldExpiryRun = { checked: number; expired: number };

export type BorrowRequestsService = {
  list(
    query: BorrowRequestQuery,
    viewer?: Actor,
  ): Promise<BorrowRequestListItem[]>;
  getVisible(id: string, viewer: Actor): Promise<BorrowRequest>;
  findDueOn(date: string): Promise<BorrowRequest[]>;
  getById(id: string): Promise<BorrowRequest>;
  listOverdue(): Promise<BorrowRequest[]>;
  create(memberId: string, bookId: string): Promise<BorrowRequest>;
  update(
    id: string,
    changes: BorrowRequestChanges,
    actor?: Actor,
  ): Promise<BorrowRequest>;
  returnBook(id: string): Promise<BorrowRequest>;
  cancel(id: string, memberId: string): Promise<BorrowRequest>;
  queuePosition(id: string, viewer?: Actor): Promise<QueuePosition>;
  expireHolds(): Promise<HoldExpiryRun>;
};

export type LoanPolicy = {
  loanPeriodDays: number;
  holdDays: number;
  defaultFinePerDay: number;
  fineMaxDays: number;
  timeZone: string;
  now?: () => Date;
};

type FineFields = Pick<
  BorrowRequest,
  "status" | "dueDate" | "finePerDay" | "fine"
>;

// requests that count against the borrow limit
const OPEN_STATUSES: BorrowRequestStatus[] = [
  "pending",
  "queued",
  "held",
  "approved",
];
// still waiting for a decision; only these can be changed or cancelled
const WAITING_STATUSES: BorrowRequestStatus[] = ["pending", "queued", "held"];

const requestChanged = () =>
  new ConflictError(
    "This request was changed by someone else at the same moment. Try again.",
    { code: "REQUEST_CHANGED" },
  );
const BORROW_LIMIT = 5;

const createBorrowRequestsService = (
  borrowRequestsRepository: BorrowRequestsRepository,
  booksService: BooksService,
  usersService: UsersService,
  events: Events,
  transaction: Transaction,
  loanPolicy: LoanPolicy,
): BorrowRequestsService => {
  const now = () => (loanPolicy.now ? loanPolicy.now() : new Date());
  const today = () => todayIn(loanPolicy.timeZone, now());

  const fineFor = (dueDate: string, finePerDay: number, returnedAt: Date | null) =>
    calculateFine(
      { dueDate, returnedAt, asOf: now() },
      {
        ratePerDay: finePerDay,
        maxDays: loanPolicy.fineMaxDays,
        timeZone: loanPolicy.timeZone,
      },
    );

  // a book still out shows what its fine comes to today
  const withFine = <T extends FineFields>(request: T): T =>
    request.status === "approved" && request.dueDate
      ? { ...request, fine: fineFor(request.dueDate, request.finePerDay, null) }
      : request;

  const announceQueue = async (
    repository: BorrowRequestsRepository,
    eventsOut: Events,
    bookId: string,
    fromPosition: number,
  ): Promise<void> => {
    const queue = await repository.findQueue(bookId);
    queue.forEach((request, index) => {
      const position = index + 1;
      if (position >= fromPosition) {
        eventsOut.emit(DOMAIN_EVENTS.QUEUE_POSITION_CHANGED, {
          memberId: request.userId,
          bookId,
          position,
        });
      }
    });
  };

  const announceStatus = (eventsOut: Events, request: BorrowRequest) => {
    eventsOut.emit(DOMAIN_EVENTS.BORROW_REQUEST_STATUS_CHANGED, {
      memberId: request.userId,
      id: request.id,
      bookId: request.bookId,
      status: request.status,
    });
  };

  const positionOf = async (
    repository: BorrowRequestsRepository,
    request: BorrowRequest,
  ): Promise<number> =>
    request.queuedAt === null
      ? 0
      : (await repository.countAheadInQueue(
          request.bookId,
          request.queuedAt,
          request.id,
        )) + 1;

  const releaseCopy = async (
    { services, repositories, events: txEvents }: Tx,
    bookId: string,
  ): Promise<void> => {
    const holdUntil = addDays(today(), loanPolicy.holdDays);
    const next = await repositories.borrowRequests.claimNextInQueue(
      bookId,
      holdUntil,
    );
    if (!next) {
      await services.books.changeAvailability(bookId, 1);
      return;
    }
    await repositories.notifications.createOnce({
      memberId: next.userId,
      borrowRequestId: next.id,
      kind: "hold-ready",
      message: `A copy of "${next.book.title}" is held for you until ${holdUntil}.`,
      forDate: today(),
    });
    announceStatus(txEvents, next);
    txEvents.emit(DOMAIN_EVENTS.QUEUE_PROMOTED, {
      memberId: next.userId,
      bookId,
      bookTitle: next.book.title,
      holdUntil,
    });
    await announceQueue(repositories.borrowRequests, txEvents, bookId, 1);
  };

  const queueOrPending = (onShelf: number) =>
    onShelf > 0
      ? { status: "pending" as const, queuedAt: null }
      : { status: "queued" as const, queuedAt: now().toISOString() };

  return {
    async list(query, viewer) {
      const requests = await borrowRequestsRepository.findAll(
        viewer && viewer.role === "user"
          ? { ...query, userId: viewer.id }
          : query,
      );
      return requests.map(withFine);
    },

    async getVisible(id, viewer) {
      const borrowRequest = await this.getById(id);
      if (viewer.role === "user" && borrowRequest.userId !== viewer.id) {
        throw new ForbiddenError("You can only see your own requests.");
      }
      return borrowRequest;
    },

    findDueOn: (date) => borrowRequestsRepository.findDueOn(date),

    async getById(id) {
      const borrowRequest = await borrowRequestsRepository.findById(id);
      if (!borrowRequest) {
        throw new NotFoundError("Borrow request not found.");
      }
      return withFine(borrowRequest);
    },

    async listOverdue() {
      const requests = await borrowRequestsRepository.findOverdue(today());
      return requests.map(withFine);
    },

    // status, dates and fine are set here, never taken from the caller
    async create(memberId, bookId) {
      await usersService.getById(memberId);
      const book = await booksService.getById(bookId);

      const open = await borrowRequestsRepository.countForMember(
        memberId,
        OPEN_STATUSES,
      );
      if (open >= BORROW_LIMIT) {
        throw new BorrowLimitReachedError(memberId, BORROW_LIMIT);
      }

      const borrowRequest = await borrowRequestsRepository.create({
        userId: memberId,
        bookId: book.id,
        ...queueOrPending(book.onShelf),
        requestedAt: today(),
        dueDate: null,
        holdUntil: null,
        finePerDay: book.finePerDay ?? loanPolicy.defaultFinePerDay,
      });
      events.emit(DOMAIN_EVENTS.BORROW_REQUEST_CREATED, borrowRequest);
      if (borrowRequest.status === "queued") {
        await announceQueue(
          borrowRequestsRepository,
          events,
          borrowRequest.bookId,
          await positionOf(borrowRequestsRepository, borrowRequest),
        );
      }
      return borrowRequest;
    },

    update(id, changes, actor) {
      return transaction(
        async ({ services, repositories, events: txEvents }) => {
          const before = await services.borrowRequests.getById(id);
          // an approved loan ends through /return, the others are final
          if (!WAITING_STATUSES.includes(before.status)) {
            throw new ConflictError(
              `This request is ${before.status} and can't be changed.`,
              { code: "REQUEST_CLOSED" },
            );
          }
          const deciding =
            changes.status === "approved" || changes.status === "rejected";
          if (actor && deciding && before.userId === actor.id) {
            throw new ForbiddenError(
              "You can't approve or reject your own request.",
            );
          }
          const oldPosition =
            before.status === "queued"
              ? await positionOf(repositories.borrowRequests, before)
              : 0;

          const approving =
            changes.status === "approved" && before.status !== "approved";

          if (approving && before.status === "queued") {
            throw new ConflictError(
              "This request is still waiting in the queue for a copy.",
              { code: "REQUEST_QUEUED" },
            );
          }

          let updates: BorrowRequestChanges = changes;
          if (approving && before.status === "held") {
            updates = {
              ...changes,
              holdUntil: null,
              dueDate: addDays(today(), loanPolicy.loanPeriodDays),
            };
          } else if (approving) {
            const book = await services.books.getById(before.bookId);
            if (book.onShelf === 0) {
              updates = { ...changes, ...queueOrPending(0) };
            } else {
              await services.books.changeAvailability(before.bookId, -1);
              updates = {
                ...changes,
                dueDate: addDays(today(), loanPolicy.loanPeriodDays),
              };
            }
          }

          const borrowRequest =
            await repositories.borrowRequests.updateIfStatus(
              id,
              [before.status],
              updates,
            );
          if (!borrowRequest) {
            throw requestChanged();
          }
          if (borrowRequest.status !== before.status) {
            announceStatus(txEvents, borrowRequest);
          }
          if (before.status === "held" && changes.status === "rejected") {
            await releaseCopy(
              { services, repositories, events: txEvents },
              before.bookId,
            );
          }
          if (before.status === "queued" && borrowRequest.status !== "queued") {
            await announceQueue(
              repositories.borrowRequests,
              txEvents,
              before.bookId,
              oldPosition,
            );
          }
          if (before.status !== "queued" && borrowRequest.status === "queued") {
            await announceQueue(
              repositories.borrowRequests,
              txEvents,
              before.bookId,
              await positionOf(repositories.borrowRequests, borrowRequest),
            );
          }
          return withFine(borrowRequest);
        },
      );
    },

    returnBook(id) {
      return transaction(
        async ({ services, repositories, events: txEvents }) => {
          const before = await services.borrowRequests.getById(id);
          const alreadyReturned = new ConflictError(
            "This book has already been returned.",
            { code: "ALREADY_RETURNED" },
          );
          if (before.status === "returned") {
            throw alreadyReturned;
          }

          // only an approved loan had the book out, so only it is charged
          const returnedAt = now();
          const charge =
            before.status === "approved" && before.dueDate
              ? {
                  returnedAt: returnedAt.toISOString(),
                  fine: fineFor(before.dueDate, before.finePerDay, returnedAt),
                }
              : {};
          const borrowRequest =
            await repositories.borrowRequests.updateIfStatus(
              id,
              [before.status],
              { status: "returned", ...charge },
            );
          if (!borrowRequest) {
            throw before.status === "approved"
              ? alreadyReturned
              : requestChanged();
          }
          announceStatus(txEvents, borrowRequest);

          // the returned copy goes to the queue first, then the shelf
          if (before.status === "approved") {
            await releaseCopy(
              { services, repositories, events: txEvents },
              before.bookId,
            );
          }
          return borrowRequest;
        },
      );
    },

    cancel(id, memberId) {
      return transaction(async (tx) => {
        const before = await tx.services.borrowRequests.getById(id);
        const oldPosition =
          before.status === "queued"
            ? await positionOf(tx.repositories.borrowRequests, before)
            : 0;
        if (before.userId !== memberId) {
          throw new ForbiddenError();
        }
        if (!WAITING_STATUSES.includes(before.status)) {
          throw new ConflictError(
            "Only a request that is still waiting can be cancelled.",
            { code: "NOT_CANCELLABLE" },
          );
        }

        const borrowRequest =
          await tx.repositories.borrowRequests.updateIfStatus(
            id,
            [before.status],
            { status: "cancelled", holdUntil: null },
          );
        if (!borrowRequest) {
          throw requestChanged();
        }
        announceStatus(tx.events, borrowRequest);
        if (before.status === "held") {
          await releaseCopy(tx, before.bookId);
        }
        if (before.status === "queued") {
          await announceQueue(
            tx.repositories.borrowRequests,
            tx.events,
            before.bookId,
            oldPosition,
          );
        }
        return borrowRequest;
      });
    },

    async queuePosition(id, viewer) {
      const request = viewer
        ? await this.getVisible(id, viewer)
        : await this.getById(id);
      const queued = request.status === "queued" && request.queuedAt !== null;
      return {
        id: request.id,
        bookId: request.bookId,
        status: request.status,
        position: queued
          ? await positionOf(borrowRequestsRepository, request)
          : null,
      };
    },

    async expireHolds() {
      const holds = await borrowRequestsRepository.findExpiredHolds(today());
      const errors: unknown[] = [];
      let expired = 0;

      for (const hold of holds) {
        try {
          const done = await transaction(async (tx) => {
            const expiredHold =
              await tx.repositories.borrowRequests.updateIfStatus(
                hold.id,
                ["held"],
                { status: "expired", holdUntil: null },
              );
            if (!expiredHold) {
              return false;
            }
            announceStatus(tx.events, expiredHold);
            await releaseCopy(tx, hold.bookId);
            return true;
          });
          if (done) {
            expired += 1;
          }
        } catch (err) {
          errors.push(err);
        }
      }

      if (errors.length > 0) {
        throw new AggregateError(
          errors,
          `${errors.length} of ${holds.length} holds could not be expired`,
        );
      }
      return { checked: holds.length, expired };
    },
  };
};

export default createBorrowRequestsService;
