import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";
import config from "../config/config.js";

const adapter = new PrismaPg({ connectionString: config.databaseUrl });

// With DB_QUERY_LOG=true every SQL query Prisma sends is printed to the
// terminal, with its parameters and how long it took.
const prisma = new PrismaClient({
  adapter,
  log: config.dbQueryLog ? [{ emit: "event", level: "query" }] : [],
});

if (config.dbQueryLog) {
  prisma.$on("query", (event) => {
    // hide bcrypt hashes so they never end up in the terminal or a log file
    const params = event.params.replace(/\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/g, "[hidden hash]");
    console.log(`[query] ${Math.round(event.duration)}ms ${event.query} ${params}`);
  });
}

export default prisma;
