// Exercise 8, Task 2: create borrow requests by calling the service directly.
// No Express, no server, no req/res. Just the database, the repositories and
// the services, the same way the nightly job will use them.
//   node db/create-borrow-request.js
import prisma from "../src/db/prisma.js";
import createRepositories from "../src/repositories/createRepositories.js";
import createServices from "../src/services/createServices.js";
import domainEvents from "../src/events/domainEvents.js";
import {
  BorrowLimitReachedError,
  NotFoundError,
} from "../src/errors/domainErrors.js";

const MEMBER_ID = "m-2001"; // Sara Malik, a normal member with no requests

const services = createServices(createRepositories(prisma), domainEvents);
const created = [];

const tryCreate = async (label, memberId, bookId) => {
  try {
    const request = await services.borrowRequests.create(memberId, bookId);
    created.push(request.id);
    console.log(
      `${label}: created ${request.id} (${request.status}, due ${request.dueDate}, fine ${request.finePerDay}/day)`,
    );
  } catch (err) {
    const kind =
      err instanceof BorrowLimitReachedError
        ? "limit reached"
        : err instanceof NotFoundError
          ? "not found"
          : "unexpected";
    console.log(`${label}: ${kind} -> ${err.name} ${err.code}: ${err.message}`);
  }
};

try {
  // 1. normal request, then four more to reach the limit of 5
  for (let i = 1; i <= 5; i += 1) {
    await tryCreate(`request ${i}`, MEMBER_ID, "bk-1");
  }

  // 2. the 6th breaks the limit
  await tryCreate("request 6", MEMBER_ID, "bk-1");

  // 3. a book and a member that don't exist
  await tryCreate("missing book", MEMBER_ID, "bk-nope");
  await tryCreate("missing member", "m-nope", "bk-1");
} finally {
  // leave the member with no open requests again
  for (const id of created) {
    await services.borrowRequests.update(id, { status: "rejected" });
  }
  console.log(`cleaned up: rejected ${created.length} requests`);
  await prisma.$disconnect();
}
