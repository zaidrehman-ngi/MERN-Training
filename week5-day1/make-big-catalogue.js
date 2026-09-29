/**
 * make-big-catalogue.js
 * Week 5, Day 1 — Exercise 4.
 *
 * Writes a large CSV of loan records to disk. You need one, because streams
 * solve a problem you cannot see on a small file: read a 2 KB file into memory
 * and nothing bad happens, so nothing is learned.
 *
 *     node make-big-catalogue.js 200        # ~200 MB, the default
 *     node make-big-catalogue.js 1000       # ~1 GB, if you want it to hurt
 *
 * Writes catalogue.csv in the current folder. Add it to .gitignore — do not
 * commit a 200 MB file, and check with `git status` before you push.
 *
 * Note how this script itself is written: it does not build the whole file in
 * memory and write it once. It writes in chunks and waits when the buffer is
 * full. That waiting is called backpressure and it is task 5. Read the loop
 * below before you start the exercise — it is the shape of the answer.
 */

const fs = require("fs");

const targetMb = Number(process.argv[2]) || 200;
const OUT = "catalogue.csv";

const BRANCHES = ["Clifton", "Saddar", "Gulshan", "Korangi", "Nazimabad"];
const TITLES = [
  "Dune",
  "Neuromancer",
  "Hyperion",
  "Ubik",
  "Foundation",
  "Sindhi Folk Tales",
  "The Sea and the Salt",
  "Karachi: A Sketchbook",
];
const STATUSES = ["returned", "returned", "returned", "overdue", "out"];

const stream = fs.createWriteStream(OUT);
stream.write("loan_id,member_id,book_title,branch,status,days_late,fine_rs\n");

let written = 0;
let row = 0;
const targetBytes = targetMb * 1024 * 1024;

function makeRow(i) {
  const status = STATUSES[i % STATUSES.length];
  const daysLate = status === "overdue" ? (i % 30) + 1 : 0;
  return (
    `ln-${i},m-${1000 + (i % 5000)},"${TITLES[i % TITLES.length]}",` +
    `${BRANCHES[i % BRANCHES.length]},${status},${daysLate},${daysLate * 20}\n`
  );
}

function writeSome() {
  let ok = true;

  while (written < targetBytes && ok) {
    const chunk = makeRow(row);
    row += 1;
    written += chunk.length;

    // write() returns false when the internal buffer is full. That is the
    // stream telling us to stop and wait — ignoring it is how scripts that
    // "use streams" still run out of memory.
    ok = stream.write(chunk);
  }

  if (written < targetBytes) {
    stream.once("drain", writeSome);
  } else {
    stream.end();
  }
}

stream.on("finish", () => {
  const mb = (fs.statSync(OUT).size / 1024 / 1024).toFixed(1);
  console.log(`wrote ${OUT}: ${mb} MB, ${row.toLocaleString()} rows`);
});

writeSome();
