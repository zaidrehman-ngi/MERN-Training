import prisma from "../src/db/prisma.js";
import createRepositories from "../src/repositories/createRepositories.js";
import createServices from "../src/services/createServices.js";
import domainEvents from "../src/events/domainEvents.js";

const services = createServices(createRepositories(prisma), domainEvents);
const DUNE = "bk-1";
const borrowers = ["m-1001", "m-1002", "m-1003"];

try {
  let taken = 0;
  while ((await services.books.getById(DUNE)).onShelf > 0) {
    const request = await services.borrowRequests.create(
      borrowers[taken % borrowers.length],
      DUNE,
    );
    await services.borrowRequests.update(request.id, { status: "approved" });
    taken += 1;
  }
  console.log(`Dune: ${taken} more copies lent out, 0 on the shelf.`);
  console.log("Open http://localhost:3100/queue-demo.html in two browsers:");
  console.log("  member:    sara.malik@lib.pk / Library@2026");
  console.log("  librarian: librarian@lib.pk / Librarian@2026");
} finally {
  await prisma.$disconnect();
}
