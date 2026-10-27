import { notFound } from "../errors/ApiError.js";
import { DOMAIN_EVENTS } from "../events/domainEvents.js";

const createBorrowRequestsService = (
  borrowRequestsRepository,
  booksService,
  events,
) => ({
  list: (query) => borrowRequestsRepository.findAll(query),

  async getById(id) {
    const borrowRequest = await borrowRequestsRepository.findById(id);
    if (!borrowRequest) {
      throw notFound("Borrow request not found.");
    }
    return borrowRequest;
  },

  async create(requestData) {
    const borrowRequest = await borrowRequestsRepository.create(requestData);
    events.emit(DOMAIN_EVENTS.BORROW_REQUEST_CREATED, borrowRequest);
    return borrowRequest;
  },

  async update(id, changes) {
    const before = await this.getById(id);

    // approving hands a copy to the member
    if (changes.status === "approved" && before.status !== "approved") {
      await booksService.changeAvailability(before.bookId, -1);
    }

    const borrowRequest = await borrowRequestsRepository.updateById(id, changes);
    if (!borrowRequest) {
      throw notFound("Borrow request not found.");
    }
    return borrowRequest;
  },

  async returnBook(id) {
    const before = await this.getById(id);

    // only an approved request has a copy out to bring back
    if (before.status === "approved") {
      await booksService.changeAvailability(before.bookId, 1);
    }

    return borrowRequestsRepository.updateById(id, { status: "returned" });
  },
});

export default createBorrowRequestsService;
