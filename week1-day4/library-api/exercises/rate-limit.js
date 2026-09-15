// Exercise 3 - PART A - Task 1

const limits = new Map();

const MAX_REQUESTS = 5;
const WINDOW_MS = 10 * 1000;

function allow(key) {
  const now = Date.now();
  const record = limits.get(key);

  if (!record) {
    limits.set(key, {
      count: 1,
      windowStart: now,
    });

    return {
      allowed: true,
      remaining: 4,
      resetIn: 10,
    };
  }

  const elapsed = now - record.windowStart;

  if (elapsed >= WINDOW_MS) {
    limits.set(key, {
      count: 1,
      windowStart: now,
    });

    return {
      allowed: true,
      remaining: 4,
      resetIn: 10,
    };
  }

  if (record.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((WINDOW_MS - elapsed) / 1000),
    };
  }

  record.count++;

  return {
    allowed: true,
    remaining: MAX_REQUESTS - record.count,
    resetIn: Math.ceil((WINDOW_MS - elapsed) / 1000),
  };
}

// Exercise 3 - PART A - Task 2

// const key = 'member-1';

// for (let i = 1; i <= 8; i++) {
//   console.log(`Request ${i}:`, allow(key));
// }

// setTimeout(() => {
//   console.log('After waiting:');
//   console.log('Request 9:', allow(key));
// }, 11000);

// Exercise 3 - PART A - Task 3

const key = 'attacker';

// First request starts the window
allow(key);

// Wait until just before the window ends
setTimeout(() => {
  const start = Date.now();

  console.log('--- End of first window ---');

  for (let i = 1; i <= 4; i++) {
    console.log(`End request ${i}:`, allow(key));
  }

  // Wait until the next window starts
  setTimeout(() => {
    console.log('--- Start of next window ---');

    for (let i = 1; i <= 5; i++) {
      console.log(`Start request ${i}:`, allow(key));
    }

    const elapsed = Date.now() - start;
    console.log(`Total time: ${elapsed} ms`);
  }, 1000);
}, 9000);
