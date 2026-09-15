/**
 * Week 1, Day 4 — Exercise 1
 * JWT anatomy: what a token hides, what it does not, and what a signature buys you.
 *
 * The tokens below are real. They are signed with the secret in DEV_SECRET, so
 * everything in this exercise actually verifies, actually fails, and actually
 * expires. Nothing here is a mock-up.
 *
 * ---------------------------------------------------------------------------
 * SETUP
 *
 *   Tasks 1 and 3 need nothing installed — atob() is a Node global.
 *   Tasks 4 onward need the library:
 *
 *     npm install jsonwebtoken
 *
 *   Run with:  node exercises/jwt-demo.js
 * ---------------------------------------------------------------------------
 *
 * Before you write a single line: task 1 asks you to guess, on paper, whether
 * you need the secret to read what is inside TOKEN_A. Write the guess down
 * first. Running it before you guess teaches you nothing.
 */

// Token A — a librarian's session token, lifted off a stolen phone.
const TOKEN_A =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtLTQ0NzEiLCJlbWFpbCI6ImFpc2hhQGxpYi5wayIsInJvbGUiOiJsaWJyYXJpYW4iLCJjbmljIjoiNDIxMDEtMTIzNDU2Ny04IiwicGFzc3dvcmRIYXNoIjoiJDJiJDEwJE45cW84dUxPaWNrZ3gyWk1SWm9NeWUiLCJpYXQiOjE3NzIwMDAwMDAsImV4cCI6MTg5MzQ1NjAwMH0.4dGtNU-VxUFBpKn241fkGlyZUIYpDiKbYx-4lILVss0';

// Token B — a member's token, issued and expired in February 2025.
const TOKEN_B =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtLTkwMDIiLCJlbWFpbCI6Im9tYXJAbGliLnBrIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NDAwMDAwMDAsImV4cCI6MTc0MDAwMzYwMH0.er25s6sH465ah9cMBcDsSPh1ylWm0Pp1NvuNevaR6fI';

// The signing secret. In a real system this lives in .env and never in a file
// like this one — you classified it yourself on Day 3, Exercise 4, Part C.
const DEV_SECRET = 'karachi-central-library-dev-secret';

// ---------------------------------------------------------------------------
// TODO 1 — read the token without the secret
//
// A JWT is three base64url strings joined by dots. Split TOKEN_A on '.', then
// decode the first two parts with atob() and JSON.parse() them.
//
// Print the header and the payload. Note what you did NOT have to use.
// ---------------------------------------------------------------------------
function decodeUnverified(token) {
  const parts = token.split('.');

  const header = JSON.parse(atob(parts[0]));
  const payload = JSON.parse(atob(parts[1]));

  return { header, payload };
}

// ---------------------------------------------------------------------------
// TODO 2 — verify it properly
//
//   const jwt = require('jsonwebtoken');
//   jwt.verify(token, DEV_SECRET)  ->  returns the payload, or throws
//
// Verify TOKEN_A and print the result. Wrap it in try/catch — you will be
// reusing this function on tokens that fail, and an uncaught throw ends the
// script before the interesting part.
// ---------------------------------------------------------------------------
const jwt = require('jsonwebtoken');

function verify(token) {
  try {
    const payload = jwt.verify(token, DEV_SECRET);
    return { ok: true, payload };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// TODO 3 — tamper with it
//
// Promote yourself. Decode TOKEN_A's payload, change role from 'librarian' to
// 'admin', re-encode it, and reassemble the token keeping the ORIGINAL
// signature — header + '.' + newPayload + '.' + originalSignature.
//
// To re-encode without Buffers:
//   btoa(JSON.stringify(payload))
//     .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
// (base64url is base64 with two characters swapped and the padding dropped.)
//
// Then do both of these to your tampered token and compare:
//   1. verify()      — should fail. Print the error.
//   2. jwt.decode()  — will not fail. Print what you get.
//
// The gap between those two lines is the whole exercise. Task 4 in the sheet
// asks you what a server that used decode() for its auth check just handed you.
// ---------------------------------------------------------------------------
function tamper(token, newRole) {
  const parts = token.split('.');

  const payload = JSON.parse(atob(parts[1]));
  payload.role = newRole;

  const newPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${parts[0]}.${newPayload}.${parts[2]}`;
}

// ---------------------------------------------------------------------------
// TODO 4 — re-sign it
//
//   jwt.sign(payload, DEV_SECRET)
//
// Sign your tampered payload with the secret and verify it again. It passes,
// and you are now an admin.
//
// So: what was the signature protecting, and what has to happen on the day the
// secret leaks? Two sentences in answers.md.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Task 5 — expiry
//
// Verify TOKEN_B and print the error. Which claim caused it? Then find the
// numeric value of exp in the payload and convert it to a readable date:
//   new Date(payload.exp * 1000).toISOString()
// ---------------------------------------------------------------------------

function main() {
  console.log('=== 1. decoded without the secret ===');
  console.log(decodeUnverified(TOKEN_A));

  console.log('\n=== 2. verified with the secret ===');
  console.log(verify(TOKEN_A));

  console.log('\n=== 3. tampered, original signature ===');
  const tampered = tamper(TOKEN_A, 'admin');
  console.log('token :', tampered);
  console.log('verify:', verify(tampered));
  console.log('decode:', jwt.decode(tampered));

  console.log('\n=== 4. tampered and re-signed ===');
  const reSigned = jwt.sign(jwt.decode(tampered), DEV_SECRET);
  console.log('token :', reSigned);
  console.log('verify:', verify(reSigned));

  console.log('\n=== 5. expired token ===');
  console.log(verify(TOKEN_B));
}

main();
