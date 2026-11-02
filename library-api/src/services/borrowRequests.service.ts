import {
  BorrowLimitReachedError,
  NotFoundError,
} from "../errors/domainErrors.js";
import { DOMAIN_EVENTS } from "../events/domainEvents.js";
import type { Book } from "../types/book.ts";
import type {
  BorrowRequest,
  BorrowRequestChanges,
  BorrowRequestListItem,
  BorrowRequestQuery,
  BorrowRequestStatus,
} from "../types/borrowRequest.ts";
import type { BorrowRequestsRepository } from "../repositories/borrowRequests.repository.ts";
import { addDays, todayIn } from "../utils/dates.ts";

type BooksService = {
  getById(id: string): Promise<Book>;
  changeAvailability(id: string, change: number): Promise<Book>;
};

type UsersService = {
  getById(id: string): Promise<unknown>;
};

type Events = {
  emit(eventName: string, payload: unknown): unknown;
};

type Transaction = <T>(
  work: (tx: {
    services: { books: BooksService; borrowRequests: BorrowRequestsService };
    repositories: { borrowRequests: BorrowRequestsRepository };
  }) => Promise<T>,
) => Promise<T>;

export type BorrowRequestsService = {
  list(query: BorrowRequestQuery): Promise<BorrowRequestListItem[]>;
  findDueOn(date: string): Promise<BorrowRequest[]>;
  getById(id: string): Promise<BorrowRequest>;
  create(memberId: string, bookId: string): Promise<BorrowRequest>;
  update(id: string, changes: BorrowRequestChanges): Promise<BorrowRequest>;
  returnBook(id: string): Promise<BorrowRequest>;
};

export type LoanPolicy = {
  loanPeriodDays: number;
  timeZone: string;
  now?: () => Date;
};

// requests that count against the limit: waiting or out on loan
const OPEN_STATUSES: BorrowRequestStatus[] = ["pending", "approved"];
const BORROW_LIMIT = 5;
const DEFAULT_FINE_PER_DAY = 20;

const createBorrowRequestsService = (
  borrowRequestsRepository: BorrowRequestsRepository,
  booksService: BooksService,
  usersService: UsersService,
  events: Events,
  transaction: Transaction,
  loanPolicy: LoanPolicy,
): BorrowRequestsService => {
  const today = () =>
    todayIn(
      loanPolicy.timeZone,
      loanPolicy.now ? loanPolicy.now() : new Date(),
    );

  return {
    list: (query) => borrowRequestsRepository.findAll(query),

    findDueOn: (date) => borrowRequestsRepository.findDueOn(date),

    async getById(id) {
      const borrowRequest = await borrowRequestsRepository.findById(id);
      if (!borrowRequest) {
        throw new NotFoundError("Borrow request not found.");
      }
      return borrowRequest;
    },

    // The caller only says who and which book. Status, dates and fine are the
    // library's rules, so they're set here and never taken from the caller.
    async create(memberId, bookId) {
      // both throw NotFoundError if they don't exist (or were deleted)
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
        status: "pending",
        requestedAt: today(),
        dueDate: null,
        finePerDay: book.finePerDay ?? DEFAULT_FINE_PER_DAY,
      });
      events.emit(DOMAIN_EVENTS.BORROW_REQUEST_CREATED, borrowRequest);
      return borrowRequest;
    },

    // The copy count and the request are saved together or not at all.
    update(id, changes) {
      return transaction(async ({ services, repositories }) => {
        const before = await services.borrowRequests.getById(id);

        const approving =
          changes.status === "approved" && before.status !== "approved";

        // approving hands a copy to the member
        if (approving) {
          await services.books.changeAvailability(before.bookId, -1);
        }

        const borrowRequest = await repositories.borrowRequests.updateById(
          id,
          approving
            ? {
                ...changes,
                dueDate: addDays(today(), loanPolicy.loanPeriodDays),
              }
            : changes,
        );
        if (!borrowRequest) {
          throw new NotFoundError("Borrow request not found.");
        }
        return borrowRequest;
      });
    },

    returnBook(id) {
      return transaction(async ({ services, repositories }) => {
        const before = await services.borrowRequests.getById(id);

        // only an approved request has a copy out to bring back
        if (before.status === "approved") {
          await services.books.changeAvailability(before.bookId, 1);
        }

        const borrowRequest = await repositories.borrowRequests.updateById(id, {
          status: "returned",
        });
        if (!borrowRequest) {
          throw new NotFoundError("Borrow request not found.");
        }
        return borrowRequest;
      });
    },
  };
};

export default createBorrowRequestsService;
