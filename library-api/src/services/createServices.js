import createBooksService from "./books.service.js";
import createUsersService from "./users.service.ts";
import createBorrowRequestsService from "./borrowRequests.service.ts";
import createAuthService from "./auth.service.js";
import createRemindersService from "./reminders.service.ts";
import config from "../config/config.js";
import logger from "../config/logger.js";

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
        events: heldEvents,
      }),
    );
    held.forEach((args) => events.emit(...args));
    return result;
  };

  const books = createBooksService(repositories.books, events);
  const users = createUsersService(repositories.users, events);
  const borrowRequests = createBorrowRequestsService(
    repositories.borrowRequests,
    books,
    users,
    events,
    transaction,
    {
      loanPeriodDays: config.loanPeriodDays,
      holdDays: config.holdDays,
      defaultFinePerDay: config.finePerDay,
      timeZone: config.libraryTimeZone,
    },
  );

  return {
    books,
    users,
    borrowRequests,
    reminders: createRemindersService(
      borrowRequests,
      repositories.notifications,
      {
        timeZone: config.libraryTimeZone,
        log: (message) => logger.info(message),
        logError: (message, err) => logger.error(message, err),
      },
    ),
    auth: createAuthService(
      repositories.users,
      repositories.refreshTokens,
      repositories.revokedTokens,
    ),
  };
};

export default createServices;
