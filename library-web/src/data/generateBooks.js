/**
 * generateBooks.js
 * Week 4, Day 2 — Exercise 3 and 4.
 *
 * Nine books do not make a slow page. You can render the whole fixture on
 * every keystroke and the profiler will report numbers so small they are
 * indistinguishable from noise — which would teach you to "optimise" things
 * that were never a problem, the exact habit today is meant to prevent.
 *
 * So: this makes as many books as you want, deterministically. Same seed,
 * same books, every run — so the number you measure before your change and
 * the number you measure after are actually comparable.
 *
 *     import { generateBooks } from './data/generateBooks';
 *     const books = generateBooks(500);
 *
 * Start at 500 for Exercise 3. If your machine is fast and the profiler is
 * not showing you anything interesting, go to 2000 before you conclude there
 * is nothing to find.
 *
 * The shape matches books.fixture.js exactly, including the awkward records:
 * roughly one in twelve has a null author or a missing cover, and a handful
 * carry the undocumented RESERVED_STACK status. Your BookCard has handled
 * those since Week 2 — this is a good moment to find out whether it still
 * does at volume.
 */

const TITLE_A = [
  "The Salt",
  "A History of",
  "Notes on",
  "The Last",
  "Letters from",
  "Coastal",
  "The Quiet",
  "Winter in",
  "The Sixth",
  "Fragments of",
  "The Cartographer of",
  "Monsoon",
  "The Long",
  "An Account of",
  "The Glass",
];

const TITLE_B = [
  "Karachi",
  "the Indus",
  "Clifton",
  "Saddar",
  "the Makran Coast",
  "Gwadar",
  "the Delta",
  "Thatta",
  "the Northern Passes",
  "Keamari",
  "Sindh",
  "the Harbour",
  "Empress Market",
  "the Old City",
  "Manora",
];

const SURNAMES = [
  "Qureshi",
  "Kazmi",
  "Batool",
  "Shah",
  "Memon",
  "Soomro",
  "Jatoi",
  "Abbasi",
  "Rizvi",
  "Chandio",
  "Bhutto",
  "Sheikh",
  "Ansari",
  "Baloch",
];

const INITIALS = ["A.", "M.", "S.", "Z.", "F.", "H.", "N.", "R.", "T.", "Y."];

const STATUSES = ["available", "available", "available", "out", "overdue"];

/** Deterministic pseudo-random. Same seed in, same sequence out. */
function makeRandom(seed) {
  let s = seed >>> 0;
  return function next() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const pick = (rand, list) => list[Math.floor(rand() * list.length)];

/**
 * generateBooks(count, seed?) -> Book[]
 *
 * count  how many records to make
 * seed   defaults to 42 — change it only if you want a different catalogue,
 *        and change it back before you compare two measurements
 */
export function generateBooks(count = 500, seed = 42) {
  const rand = makeRandom(seed);
  const books = [];

  for (let i = 0; i < count; i += 1) {
    const total = 1 + Math.floor(rand() * 6);
    const status = pick(rand, STATUSES);
    const onShelf = status === "out" ? 0 : Math.floor(rand() * (total + 1));

    // roughly 1 in 12 records is missing something, as in the real catalogue
    const isAwkward = rand() < 0.08;
    const isVeryAwkward = rand() < 0.02;

    books.push({
      id: `gen-${i + 1}`,
      title: `${pick(rand, TITLE_A)} ${pick(rand, TITLE_B)}`,
      author: isAwkward
        ? null
        : `${pick(rand, INITIALS)} ${pick(rand, SURNAMES)}`,
      year: 1950 + Math.floor(rand() * 76),
      isbn: `978${String(1000000000 + Math.floor(rand() * 899999999))}`,
      coverUrl: isAwkward ? null : `/covers/gen-${(i % 12) + 1}.jpg`,
      onShelf,
      totalCopies: total,
      finePerDay: 20,
      status: isVeryAwkward ? "RESERVED_STACK" : status,
    });
  }

  return books;
}
