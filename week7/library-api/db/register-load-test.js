// Exercise 7, Task 5: what 50 registrations at the same time do to other
// requests. Start the server first, then run:
//   node db/register-load-test.js http://localhost:3100 /register-path
// It times GET / (only JavaScript) and a static file from /uploads (needs a
// file read, which uses Node's thread pool) while the registrations run.
const base = process.argv[2] ?? "http://localhost:3100";
const registerPath = process.argv[3] ?? "/api/v1/auth/register";
const filePath = process.argv[4] ?? "/uploads/dune.jpg";
const run = Date.now();

let failed = 0;
const timeRequest = async (url, options) => {
  const start = performance.now();
  try {
    const res = await fetch(url, options);
    await res.arrayBuffer();
  } catch {
    failed += 1; // e.g. the connection was dropped while the server was stuck
  }
  return performance.now() - start;
};

const summary = (times) => {
  const sorted = [...times].sort((a, b) => a - b);
  const avg = sorted.reduce((sum, t) => sum + t, 0) / sorted.length;
  return `avg ${Math.round(avg)} ms, max ${Math.round(sorted.at(-1))} ms (${sorted.length} requests)`;
};

// keep sending the two probe requests every 50 ms until told to stop
const probe = async (url, stop) => {
  const times = [];
  while (!stop.done) {
    times.push(await timeRequest(url));
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return times;
};

// 1. the probes on their own
let stop = { done: false };
let pings = probe(`${base}/`, stop);
let files = probe(base + filePath, stop);
await new Promise((resolve) => setTimeout(resolve, 1500));
stop.done = true;
console.log(`Quiet server   GET /         : ${summary(await pings)}`);
console.log(`Quiet server   GET ${filePath}: ${summary(await files)}`);

// 2. the probes while 50 registrations happen at the same time
stop = { done: false };
pings = probe(`${base}/`, stop);
files = probe(base + filePath, stop);

const start = performance.now();
const registrations = Array.from({ length: 50 }, (_, i) =>
  timeRequest(base + registerPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Load Test",
      email: `load-${run}-${i}@lib.pk`,
      password: "LoadTest123!",
      branch: "Clifton Branch",
      joined: "2026-10-20",
    }),
  }),
);
const registerTimes = await Promise.all(registrations);
const allDone = performance.now() - start;
stop.done = true;

console.log(`50 at once     registrations : ${summary(registerTimes)}, all finished after ${Math.round(allDone)} ms`);
console.log(`During them    GET /         : ${summary(await pings)}`);
console.log(`During them    GET ${filePath}: ${summary(await files)}`);
if (failed > 0) console.log(`Requests that failed (connection dropped): ${failed}`);
