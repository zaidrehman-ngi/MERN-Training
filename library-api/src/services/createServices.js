import createBooksService from "./books.service.js";
import createUsersService from "./users.service.js";
import createBorrowRequestsService from "./borrowRequests.service.js";
import createAuthService from "./auth.service.js";

const createServices = (repositories, events) => {
  const books = createBooksService(repositories.books, events);

  return {
    books,
    users: createUsersService(repositories.users),
    borrowRequests: createBorrowRequestsService(
      repositories.borrowRequests,
      books,
    ),
    auth: createAuthService(
      repositories.users,
      repositories.refreshTokens,
      repositories.revokedTokens,
    ),
  };
};

export default createServices;
