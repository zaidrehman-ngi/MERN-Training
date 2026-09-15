const bcrypt = require('bcrypt');

const password = 'Library@2026';

// Task 2 — Hash the password
const hash = bcrypt.hashSync(password, 12);

console.log('Password:', password);
console.log('Hash:', hash);

// Task 2 — Hash the same password again
const hash2 = bcrypt.hashSync(password, 12);

console.log('Second Hash:', hash2);

// Task 4 — Verify correct and wrong passwords
const correctPassword = bcrypt.compareSync('Library@2026', hash);
const wrongPassword = bcrypt.compareSync('WrongPassword', hash);

console.log('Correct password:', correctPassword);
console.log('Wrong password:', wrongPassword);

// Task 5 — Hash the same password for two members
const member1Hash = bcrypt.hashSync('Library@2026', 12);
const member2Hash = bcrypt.hashSync('Library@2026', 12);

console.log('Member 1 hash:', member1Hash);
console.log('Member 2 hash:', member2Hash);
console.log('Hashes match:', member1Hash === member2Hash);

// Task 6 — Compare bcrypt cost factor timings
console.log('\nCost Factor Timings');

const costs = [8, 10, 12, 14];

for (const cost of costs) {
  const start = process.hrtime.bigint();

  bcrypt.hashSync('Library@2026', cost);

  const end = process.hrtime.bigint();
  const milliseconds = Number(end - start) / 1_000_000;

  console.log(`Cost ${cost}: ${milliseconds.toFixed(2)} ms`);
}
