import { notFound } from "../errors/ApiError.js";

const createBorrowRequestsService = (borrowRequestsRepository) => ({
  list: (query) => borrowRequestsRepository.findAll(query),

  async getById(id) {
    const borrowRequest = await borrowRequestsRepository.findById(id);
    if (!borrowRequest) {
      throw notFound("Borrow request not found.");
    }
    return borrowRequest;
  },

  create: (requestData) => borrowRequestsRepository.create(requestData),

  async update(id, changes) {
    const borrowRequest = await borrowRequestsRepository.updateById(id, changes);
    if (!borrowRequest) {
      throw notFound("Borrow request not found.");
    }
    return borrowRequest;
  },

  async returnBook(id) {
    const borrowRequest = await borrowRequestsRepository.updateById(id, {
      status: "returned",
    });
    if (!borrowRequest) {
      throw notFound("Borrow request not found.");
    }
    return borrowRequest;
  },
});

export default createBorrowRequestsService;
