import createBooksRepository from "./books.repository.js";
import createUsersRepository from "./users.repository.js";
import createBorrowRequestsRepository from "./borrowRequests.repository.js";

// Everything now comes from the database through Prisma.
const createRepositories = (prisma) => ({
  books: createBooksRepository(prisma),
  users: createUsersRepository(prisma),
  borrowRequests: createBorrowRequestsRepository(prisma),
});

export default createRepositories;
