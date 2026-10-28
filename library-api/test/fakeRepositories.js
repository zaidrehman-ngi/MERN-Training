// Fake repositories: same methods as the real ones, but the data is just
// arrays in memory. No Prisma, no database.

const createFakeBooksRepository = (books) => ({
  findById: async (id) => books.find((book) => book.id === id) ?? null,

  async changeAvailableCopies(id, change) {
    const book = books.find((b) => b.id === id);
    if (!book) {
      return null;
    }
    book.onShelf += change;
    return book;
  },
});

const createFakeUsersRepository = (users) => ({
  findById: async (id) => users.find((user) => user.id === id) ?? null,
});

const createFakeBorrowRequestsRepository = (requests) => ({
  findAll: async () => requests,

  findById: async (id) => requests.find((r) => r.id === id) ?? null,

  async create(requestData) {
    const request = { id: `br-${requests.length + 1}`, ...requestData };
    requests.push(request);
    return request;
  },

  async updateById(id, changes) {
    const request = requests.find((r) => r.id === id);
    if (!request) {
      return null;
    }
    Object.assign(request, changes);
    return request;
  },

  countForMember: async (memberId, statuses) =>
    requests.filter(
      (r) => r.userId === memberId && statuses.includes(r.status),
    ).length,
});

export {
  createFakeBooksRepository,
  createFakeUsersRepository,
  createFakeBorrowRequestsRepository,
};
