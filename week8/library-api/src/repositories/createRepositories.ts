import type { Prisma, PrismaClient } from "../generated/prisma/client.ts";
import createBooksRepository from "./books.repository.ts";
import createUsersRepository from "./users.repository.ts";
import createBorrowRequestsRepository from "./borrowRequests.repository.ts";
import createRefreshTokensRepository from "./refreshTokens.repository.ts";
import createRevokedTokensRepository from "./revokedTokens.repository.ts";
import createNotificationsRepository from "./notifications.repository.ts";
import createBranchesRepository from "./branches.repository.ts";

type Db = Prisma.TransactionClient;

const createTableRepositories = (db: Db) => ({
  books: createBooksRepository(db),
  users: createUsersRepository(db),
  borrowRequests: createBorrowRequestsRepository(db),
  refreshTokens: createRefreshTokensRepository(db),
  revokedTokens: createRevokedTokensRepository(db),
  notifications: createNotificationsRepository(db),
  branches: createBranchesRepository(db),
});

export type Repositories = ReturnType<typeof createTableRepositories> & {
  transaction<T>(work: (tx: Repositories) => Promise<T>): Promise<T>;
};

// inside a transaction, a nested transaction joins the one already open
const inTransaction = (tx: Db): Repositories => {
  const repositories: Repositories = {
    ...createTableRepositories(tx),
    transaction: (work) => work(repositories),
  };
  return repositories;
};

const createRepositories = (prisma: PrismaClient): Repositories => ({
  ...createTableRepositories(prisma),
  transaction: (work) => prisma.$transaction((tx) => work(inTransaction(tx))),
});

export default createRepositories;
