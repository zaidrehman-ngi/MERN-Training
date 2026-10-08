const createBorrowRequestsRepository = (db) => {
  const { borrowRequests } = db;

  return {
    async findAll({ userId, bookId, status }) {
      return borrowRequests.filter(
        (request) =>
          (!userId || request.userId === userId) &&
          (!bookId || request.bookId === bookId) &&
          (!status || request.status === status),
      );
    },

    async findById(id) {
      return borrowRequests.find((request) => request.id === id) ?? null;
    },

    async create(requestData) {
      const borrowRequest = {
        id: `br-${borrowRequests.length + 100}`,
        ...requestData,
      };
      borrowRequests.push(borrowRequest);
      return borrowRequest;
    },

    async updateById(id, changes) {
      const index = borrowRequests.findIndex((request) => request.id === id);
      if (index === -1) {
        return null;
      }

      borrowRequests[index] = { ...borrowRequests[index], ...changes, id };
      return borrowRequests[index];
    },
  };
};

export default createBorrowRequestsRepository;
