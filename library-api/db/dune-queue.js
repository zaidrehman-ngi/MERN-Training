import prisma from "../src/db/prisma.js";
import createRepositories from "../src/repositories/createRepositories.js";
import createServices from "../src/services/createServices.js";
import domainEvents from "../src/events/domainEvents.js";
import { addDays, todayIn } from "../src/utils/dates.ts";

const services = createServices(createRepositories(prisma), domainEvents);
const { borrowRequests, books } = services;
const DUNE = "bk-1";

const shelf = async () => (await books.getById(DUNE)).onShelf;
const positions = async (ids) => {
  const lines = [];
  for (const [name, id] of ids) {
    const p = await borrowRequests.queuePosition(id);
    lines.push(`${name} ${p.status}${p.position ? ` #${p.position}` : ""}`);
  }
  return lines.join(", ");
};

try {
  const loans = [];
  while ((await shelf()) > 0) {
    const member = ["m-1001", "m-1002", "m-1003"][loans.length];
    const request = await borrowRequests.create(member, DUNE);
    await borrowRequests.update(request.id, { status: "approved" });
    loans.push(request.id);
  }
  console.log(`1. all copies out: ${loans.length} more loans, Dune on shelf = ${await shelf()}`);

  const queue = [];
  for (const [name, member] of [["Sara", "m-2001"], ["Usman", "m-2002"], ["Test", "m-test"], ["Aisha", "m-1000"]]) {
    const request = await borrowRequests.create(member, DUNE);
    queue.push([name, request.id, member]);
  }
  const ids = queue.map(([name, id]) => [name, id]);
  console.log(`2. four join: ${await positions(ids)}`);

  await borrowRequests.cancel(queue[1][1], queue[1][2]);
  console.log(`3. Usman leaves: ${await positions(ids)}`);

  try {
    await borrowRequests.update(queue[2][1], { status: "approved" });
  } catch (err) {
    console.log(`4. approving Test while queued: ${err.code}`);
  }

  await borrowRequests.returnBook(loans[0]);
  const sara = await borrowRequests.getById(queue[0][1]);
  console.log(`5. a copy comes back: Sara ${sara.status} until ${sara.holdUntil}, Dune on shelf = ${await shelf()}`);
  const note = await prisma.notifications.findFirst({ where: { kind: "hold-ready" }, orderBy: { created_at: "desc" }, select: { message: true } });
  console.log(`   notification: ${note.message}`);

  const yesterday = addDays(todayIn("Asia/Karachi"), -1);
  await borrowRequests.update(queue[0][1], { holdUntil: yesterday });
  const run = await borrowRequests.expireHolds();
  console.log(`6. Sara doesn't come (hold set to end ${yesterday}), expire job: ${JSON.stringify(run)}`);
  console.log(`   now: ${await positions(ids)}`);

  const collected = await borrowRequests.update(queue[2][1], { status: "approved" });
  console.log(`7. Test collects it: ${collected.status}, due ${collected.dueDate}, Dune on shelf = ${await shelf()}`);
} finally {
  await prisma.$disconnect();
}
