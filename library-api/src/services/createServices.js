import createBooksService from "./books.service.js";
import createUsersService from "./users.service.js";
import createBorrowRequestsService from "./borrowRequests.service.js";
import createAuthService from "./auth.service.js";

const createServices = (repositories, events) => {
  // Gives work services and repositories that use one transaction. Their
  // events wait until it commits, so a rolled back change is never announced.
  const transaction = async (work) => {
    const held = [];
    const heldEvents = { emit: (...args) => held.push(args) };
    const result = await repositories.transaction((txRepositories) =>
      work({
        services: createServices(txRepositories, heldEvents),
        repositories: txRepositories,
      }),
    );
    held.forEach((args) => events.emit(...args));
    return result;
  };

  const books = createBooksService(repositories.books, events);
  const users = createUsersService(repositories.users);

  return {
    books,
    users,
    borrowRequests: createBorrowRequestsService(
      repositories.borrowRequests,
      books,
      users,
      events,
      transaction,
    ),
    auth: createAuthService(
      repositories.users,
      repositories.refreshTokens,
      repositories.revokedTokens,
    ),
  };
};

export default createServices;
