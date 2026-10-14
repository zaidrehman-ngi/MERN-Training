import "dotenv/config";
import { performance } from "node:perf_hooks";
import pg from "pg";

const { Client } = pg;
const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required to run the overdue benchmark.");
}

const client = new Client({ connectionString: DATABASE_URL });

await client.connect();

try {
  const { rows: [{ today }] } = await client.query(
    "SELECT CURRENT_DATE::text AS today",
  );

  const nodeStart = performance.now();
  const { rows: allLoans } = await client.query(`
    SELECT loan_id::text, member_id::text, due_on::text, returned_on::text
    FROM borrow_requests
  `);
  const nodeTopTen = allLoans
    .filter((loan) => loan.returned_on === null && loan.due_on < today)
    .sort((a, b) => a.due_on.localeCompare(b.due_on)
      || a.loan_id.localeCompare(b.loan_id))
    .slice(0, 10);
  const nodeElapsedMs = performance.now() - nodeStart;

  const sqlStart = performance.now();
  const { rows: sqlTopTen } = await client.query(`
    SELECT loan_id::text, member_id::text, due_on::text, returned_on::text
    FROM borrow_requests
    WHERE returned_on IS NULL
      AND due_on < CURRENT_DATE
    ORDER BY due_on ASC, loan_id
    LIMIT 10
  `);
  const sqlElapsedMs = performance.now() - sqlStart;

  console.log(`Current database date: ${today}`);
  console.log(`Node approach: ${nodeElapsedMs.toFixed(3)} ms`);
  console.log(`  Rows fetched across the network: ${allLoans.length}`);
  console.log(`  Overdue rows after Node filtering: ${nodeTopTen.length}`);
  console.log(`SQL approach: ${sqlElapsedMs.toFixed(3)} ms`);
  console.log(`  Rows fetched across the network: ${sqlTopTen.length}`);
} finally {
  await client.end();
}
