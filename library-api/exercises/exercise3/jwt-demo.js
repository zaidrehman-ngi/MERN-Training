/**
 * Week 1, Day 4 — Exercise 1
 * JWT anatomy: what a token hides, what it does not, and what a signature buys you.
 */

import jwt from "jsonwebtoken";

// Token A — a librarian's session token, lifted off a stolen phone.
const TOKEN_A =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtLTQ0NzEiLCJlbWFpbCI6ImFpc2hhQGxpYi5wayIsInJvbGUiOiJsaWJyYXJpYW4iLCJjbmljIjoiNDIxMDEtMTIzNDU2Ny04IiwicGFzc3dvcmRIYXNoIjoiJDJiJDEwJE45cW84dUxPaWNrZ3gyWk1SWm9NeWUiLCJpYXQiOjE3NzIwMDAwMDAsImV4cCI6MTg5MzQ1NjAwMH0.4dGtNU-VxUFBpKn241fkGlyZUIYpDiKbYx-4lILVss0";

// Token B — a member's token, issued and expired in February 2025.
const TOKEN_B =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtLTkwMDIiLCJlbWFpbCI6Im9tYXJAbGliLnBrIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NDAwMDAwMDAsImV4cCI6MTc0MDAwMzYwMH0.er25s6sH465ah9cMBcDsSPh1ylWm0Pp1NvuNevaR6fI";

// The signing secret.
const DEV_SECRET = "karachi-central-library-dev-secret";

function decodeUnverified(token) {
  const parts = token.split(".");

  const header = JSON.parse(atob(parts[0]));
  const payload = JSON.parse(atob(parts[1]));

  return { header, payload };
}

function verify(token) {
  try {
    const payload = jwt.verify(token, DEV_SECRET);
    return { ok: true, payload };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function tamper(token, newRole) {
  const parts = token.split(".");

  const payload = JSON.parse(atob(parts[1]));
  payload.role = newRole;

  const newPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${parts[0]}.${newPayload}.${parts[2]}`;
}

function main() {
  console.log("=== 1. decoded without the secret ===");
  console.log(decodeUnverified(TOKEN_A));

  console.log("\n=== 2. verified with the secret ===");
  console.log(verify(TOKEN_A));

  console.log("\n=== 3. tampered, original signature ===");
  const tampered = tamper(TOKEN_A, "admin");
  console.log("token :", tampered);
  console.log("verify:", verify(tampered));
  console.log("decode:", jwt.decode(tampered));

  console.log("\n=== 4. tampered and re-signed ===");
  const reSigned = jwt.sign(jwt.decode(tampered), DEV_SECRET);
  console.log("token :", reSigned);
  console.log("verify:", verify(reSigned));

  console.log("\n=== 5. expired token ===");
  console.log(verify(TOKEN_B));
}

main();
