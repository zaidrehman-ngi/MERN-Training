import createBooksService from "./books.service.js";
import createUsersService from "./users.service.js";
import createBorrowRequestsService from "./borrowRequests.service.js";
import createAuthService from "./auth.service.js";

const createServices = (repositories) => ({
  books: createBooksService(repositories.books),
  users: createUsersService(repositories.users),
  borrowRequests: createBorrowRequestsService(repositories.borrowRequests),
  auth: createAuthService(repositories.users),
});

export default createServices;
