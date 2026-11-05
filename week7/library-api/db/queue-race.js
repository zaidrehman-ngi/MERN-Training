import prisma from "../src/db/prisma.js";
import createRepositories from "../src/repositories/createRepositories.js";
import createServices from "../src/services/createServices.js";
import domainEvents from "../src/events/domainEvents.js";

const services = createServices(createRepositories(prisma), domainEvents);
const { borrowRequests, books } = services;
const DUNE = "bk-1";

const shelf = async () => (await books.getById(DUNE)).onShelf;
const status = async (id) => (await borrowRequests.getById(id)).status;
const outcomes = (results) =>
  results
    .map((r) => {
      if (r.status === "fulfilled") return "ok";
      const cause = r.reason.meta?.driverAdapterError?.cause;
      return `${r.reason.code ?? r.reason.name}${cause ? ` (${cause.originalCode} ${cause.originalMessage})` : ""}`;
    })
    .join(" / ");

const takeAllCopies = async () => {
  const loans = [];
  while ((await shelf()) > 0) {
    const member = ["m-1001", "m-1002", "m-1003"][loans.length];
    const request = await borrowRequests.create(member, DUNE);
    await borrowRequests.update(request.id, { status: "approved" });
    loans.push(request.id);
  }
  return loans;
};

try {
  const loans = await takeAllCopies();

  const a = await Promise.allSettled([
    borrowRequests.returnBook(loans[0]),
    borrowRequests.returnBook(loans[0]),
  ]);
  console.log(
    `A. same loan returned twice at once, nobody queued: ${outcomes(a)} -> Dune on shelf = ${await shelf()} (should be 1)`,
  );

  const relent = await borrowRequests.create("m-1001", DUNE);
  await borrowRequests.update(relent.id, { status: "approved" });
  const sara = await borrowRequests.create("m-2001", DUNE);
  const test = await borrowRequests.create("m-test", DUNE);

  const b = await Promise.allSettled([
    borrowRequests.returnBook(relent.id),
    borrowRequests.returnBook(loans[1]),
  ]);
  console.log(
    `B. two copies back at once, Sara and Test queued: ${outcomes(b)} -> Sara ${await status(sara.id)}, Test ${await status(test.id)}, Dune on shelf = ${await shelf()} (should be held, held, 0)`,
  );
} finally {
  await prisma.$disconnect();
}
