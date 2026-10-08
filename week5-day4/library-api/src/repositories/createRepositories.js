import createBooksRepository from "./books.repository.js";
import createUsersRepository from "./users.repository.js";
import createBorrowRequestsRepository from "./borrowRequests.repository.js";

const createRepositories = (db) => ({
  books: createBooksRepository(db),
  users: createUsersRepository(db),
  borrowRequests: createBorrowRequestsRepository(db),
});

export default createRepositories;
