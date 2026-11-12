import createBooksService from "./books.service.ts";
import createUsersService from "./users.service.ts";
import createBorrowRequestsService from "./borrowRequests.service.ts";
import type { Transaction } from "./borrowRequests.service.ts";
import createAuthService from "./auth.service.ts";
import createRemindersService from "./reminders.service.ts";
import createNotificationsService from "./notifications.service.ts";
import createBranchesService from "./branches.service.ts";
import type { Repositories } from "../repositories/createRepositories.ts";
import type { Events } from "../types/events.ts";
import config from "../config/config.ts";
import logger from "../config/logger.ts";

const createServices = (repositories: Repositories, events: Events) => {
  // events are held until the transaction commits, so a rollback is never announced
  const transaction: Transaction = async (work) => {
    const held: [string, unknown][] = [];
    const heldEvents: Events = {
      emit: (eventName, payload) => held.push([eventName, payload]),
    };
    const result = await repositories.transaction((txRepositories) =>
      work({
        services: createServices(txRepositories, heldEvents),
        repositories: txRepositories,
        events: heldEvents,
      }),
    );
    held.forEach(([eventName, payload]) => events.emit(eventName, payload));
    return result;
  };

  const books = createBooksService(repositories.books, events);
  const users = createUsersService(
    repositories.users,
    events,
    config.libraryTimeZone,
  );
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
      fineMaxDays: config.fineMaxDays,
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
      events,
      {
        timeZone: config.libraryTimeZone,
        log: (message) => logger.info(message),
        logError: (message, err) => logger.error(message, err),
      },
    ),
    notifications: createNotificationsService(repositories.notifications),
    branches: createBranchesService(repositories.branches),
    auth: createAuthService(
      repositories.users,
      repositories.refreshTokens,
      repositories.revokedTokens,
    ),
  };
};

export type Services = ReturnType<typeof createServices>;

export default createServices;
