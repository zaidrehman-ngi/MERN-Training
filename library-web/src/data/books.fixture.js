/**
 * books.fixture.js
 * Week 2, Day 3 — used by Exercise 2 and Exercise 4.
 *
 * This is real-shaped data, not tidy data. It is an export of forty years of
 * catalogue records: some typed in by hand in the 1990s, some imported from a
 * supplier feed, some created last week by a librarian in a hurry.
 *
 * GOOD_BOOKS is what a tutorial would give you.
 * MESSY_BOOKS is what the API will actually hand your component.
 *
 * Your BookCard has to survive both. Exercise 4 is not finished until every
 * record in MESSY_BOOKS renders something sensible instead of crashing or
 * showing "undefined" to a member.
 *
 * Do not fix the data. Fixing the data is not your job and you will not be
 * allowed to do it in Week 8 either.
 */

export const GOOD_BOOKS = [
  {
    id: "bk-1",
    title: "Dune",
    author: "Frank Herbert",
    year: 1965,
    isbn: "9780441013593",
    coverUrl: "/covers/dune.jpg",
    onShelf: 3,
    totalCopies: 5,
    finePerDay: 20,
    status: "available",
  },
  {
    id: "bk-2",
    title: "Neuromancer",
    author: "William Gibson",
    year: 1984,
    isbn: "9780441569595",
    coverUrl: "/covers/neuromancer.jpg",
    onShelf: 0,
    totalCopies: 2,
    finePerDay: 20,
    status: "out",
  },
  {
    id: "bk-3",
    title: "Hyperion",
    author: "Dan Simmons",
    year: 1989,
    isbn: "9780553283686",
    coverUrl: "/covers/hyperion.jpg",
    onShelf: 1,
    totalCopies: 4,
    finePerDay: 20,
    status: "overdue",
  },
];

export const MESSY_BOOKS = [
  {
    // Author is null. Old records digitised from index cards often are.
    id: "bk-4",
    title: "Report on the Karachi Municipal Library, 1961",
    author: null,
    year: 1961,
    isbn: "9780000000001",
    coverUrl: "/covers/report-1961.jpg",
    onShelf: 1,
    totalCopies: 1,
    finePerDay: 20,
    status: "available",
  },
  {
    // No cover image at all. Roughly a third of the catalogue.
    id: "bk-5",
    title: "Sindhi Folk Tales",
    author: "Compiled by the Sindh Cultural Board",
    year: 1978,
    coverUrl: null,
    isbn: "9780000000002",
    onShelf: 2,
    totalCopies: 2,
    finePerDay: 20,
    status: "available",
  },
  {
    // A title long enough to destroy any layout that assumes one line.
    id: "bk-6",
    title:
      "A Comprehensive and Illustrated Survey of the Coastal Flora of Sindh " +
      "and Balochistan, With Notes on Seasonal Variation and an Appendix of " +
      "Local Names in Six Languages",
    author: "M. A. Qureshi",
    year: 1994,
    isbn: "9780000000003",
    coverUrl: "/covers/flora.jpg",
    onShelf: 0,
    totalCopies: 1,
    finePerDay: 20,
    status: "out",
  },
  {
    // year arrived as a string from the supplier feed. It is not a number.
    id: "bk-7",
    title: "The Sea and the Salt",
    author: "Zubaida Kazmi",
    year: "2003",
    isbn: "9780000000004",
    coverUrl: "/covers/sea-salt.jpg",
    onShelf: 4,
    totalCopies: 4,
    finePerDay: 20,
    status: "available",
  },
  {
    // status is a value nobody documented. It came from the 2011 migration.
    id: "bk-8",
    title: "Karachi: A Sketchbook",
    author: "Farida Batool",
    year: 2015,
    isbn: "9780000000005",
    coverUrl: "/covers/sketchbook.jpg",
    onShelf: 1,
    totalCopies: 3,
    finePerDay: 20,
    status: "RESERVED_STACK",
  },
  {
    // Several fields simply absent. Created by a librarian mid-shift.
    id: "bk-9",
    title: "Untitled donation, box 14",
    onShelf: 1,
    totalCopies: 1,
    status: "available",
  },
];

export const ALL_BOOKS = [...GOOD_BOOKS, ...MESSY_BOOKS];
