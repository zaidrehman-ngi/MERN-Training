import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";
import config from "../config/config.js";

const adapter = new PrismaPg({ connectionString: config.databaseUrl });

// With LOG_LEVEL=debug every SQL query Prisma runs is printed to the console.
const prisma = new PrismaClient({
  adapter,
  log: config.logLevel === "debug" ? ["query"] : [],
});

export default prisma;
