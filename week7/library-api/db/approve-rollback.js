// Exercise 8, Task 4: approving is two writes in one transaction.
//   1. take a copy off the shelf (books)
//   2. save the request as approved (book_requests)
// The second write is made to fail on purpose (finePerDay -1 breaks the
// CHECK fine_per_day >= 0), so the first one has to be rolled back.
//   node db/approve-rollback.js
import prisma from "../src/db/prisma.js";
import createRepositories from "../src/repositories/createRepositories.js";
import createServices from "../src/services/createServices.js";
import domainEvents, { DOMAIN_EVENTS } from "../src/events/domainEvents.js";

const services = createServices(createRepositories(prisma), domainEvents);

let announced = 0;
domainEvents.on(DOMAIN_EVENTS.BOOK_AVAILABILITY_CHANGED, () => {
  announced += 1;
});

const showState = async (label, requestId) => {
  const book = await services.books.getById("bk-3");
  const request = await services.borrowRequests.getById(requestId);
  console.log(
    `${label}: bk-3 on shelf = ${book.onShelf}, request is ${request.status}, availability events = ${announced}`,
  );
};

const request = await services.borrowRequests.create("m-2001", "bk-3");

try {
  await showState("Before", request.id);
  try {
    await services.borrowRequests.update(request.id, {
      status: "approved",
      finePerDay: -1,
    });
  } catch (err) {
    console.log(`Second write failed: ${err.name} ${err.code}: ${err.message}`);
  }
  await showState("After", request.id);

  // the same approve without the bad value, to show the first write is real
  await services.borrowRequests.update(request.id, { status: "approved" });
  await showState("Normal approve", request.id);
} finally {
  // returning puts the copy back
  await services.borrowRequests.returnBook(request.id);
  await prisma.$disconnect();
}
