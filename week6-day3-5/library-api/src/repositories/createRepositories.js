import createBooksRepository from "./books.repository.js";
import createUsersRepository from "./users.repository.js";
import createBorrowRequestsRepository from "./borrowRequests.repository.js";
import createRefreshTokensRepository from "./refreshTokens.repository.js";
import createRevokedTokensRepository from "./revokedTokens.repository.js";

// Everything now comes from the database through Prisma.
const createRepositories = (prisma) => ({
  books: createBooksRepository(prisma),
  users: createUsersRepository(prisma),
  borrowRequests: createBorrowRequestsRepository(prisma),
  refreshTokens: createRefreshTokensRepository(prisma),
  revokedTokens: createRevokedTokensRepository(prisma),
});

export default createRepositories;
