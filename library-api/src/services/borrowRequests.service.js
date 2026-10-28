import {
  BorrowLimitReachedError,
  NotFoundError,
} from "../errors/domainErrors.js";
import { DOMAIN_EVENTS } from "../events/domainEvents.js";

// requests that count against the limit: waiting or out on loan
const OPEN_STATUSES = ["pending", "approved"];
const BORROW_LIMIT = 5;
const LOAN_DAYS = 14;

const toDateString = (date) => date.toISOString().slice(0, 10);

const createBorrowRequestsService = (
  borrowRequestsRepository,
  booksService,
  usersService,
  events,
  transaction,
) => ({
  list: (query) => borrowRequestsRepository.findAll(query),

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

    const today = new Date();
    const due = new Date(today);
    due.setDate(due.getDate() + LOAN_DAYS);

    const borrowRequest = await borrowRequestsRepository.create({
      userId: memberId,
      bookId: book.id,
      status: "pending",
      requestedAt: toDateString(today),
      dueDate: toDateString(due),
      finePerDay: book.finePerDay,
    });
    events.emit(DOMAIN_EVENTS.BORROW_REQUEST_CREATED, borrowRequest);
    return borrowRequest;
  },

  // The copy count and the request are saved together or not at all.
  update(id, changes) {
    return transaction(async ({ services, repositories }) => {
      const before = await services.borrowRequests.getById(id);

      // approving hands a copy to the member
      if (changes.status === "approved" && before.status !== "approved") {
        await services.books.changeAvailability(before.bookId, -1);
      }

      const borrowRequest = await repositories.borrowRequests.updateById(
        id,
        changes,
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

      return repositories.borrowRequests.updateById(id, { status: "returned" });
    });
  },
});

export default createBorrowRequestsService;
