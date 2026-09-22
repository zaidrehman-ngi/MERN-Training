/**
 * mockApi.js
 * Week 3, Day 2 — Exercise 4.
 *
 * A pretend backend. No network, no axios, no fetch — that is Week 4. This is
 * just promises and setTimeout, which you have known since Week 1 Day 1.
 *
 * It is deliberately not well-behaved. Read this header before you use it.
 *
 * ---------------------------------------------------------------------------
 * THE DELAYS ARE NOT RANDOM
 *
 * Each filter takes a different, fixed amount of time:
 *
 *     all        1500ms      slow, because it returns everything
 *     available   300ms
 *     out         300ms
 *     overdue     250ms
 *
 * That is not padding. Exercise 4 task 4 asks you to select "all" and then
 * immediately select "available", and watch what ends up on screen. The delays
 * are fixed so that the bug happens every single time instead of once in
 * twenty, which is how it behaves in production and why it takes three weeks
 * to find.
 * ---------------------------------------------------------------------------
 *
 * CALL COUNTER
 *
 * Every call increments a counter. Read it with getCallCount() and print it
 * on screen while you work. When you write an effect with the wrong
 * dependencies in task 3, this is how you find out — the page will look fine.
 * ---------------------------------------------------------------------------
 */

import { ALL_BOOKS } from "./books.fixture.js";

const DELAYS = {
  all: 1500,
  available: 300,
  out: 300,
  overdue: 250,
};

let callCount = 0;
let failNextCall = false;

export function getCallCount() {
  return callCount;
}

export function resetCallCount() {
  callCount = 0;
}

/**
 * Makes the very next loadBooks() call reject, once. Use it to build the
 * error state in task 2 without editing this file.
 */
export function failNext() {
  failNextCall = true;
}

/**
 * loadBooks({ filter, search }) -> Promise<Book[]>
 *
 * filter: 'all' | 'available' | 'out' | 'overdue'   (default 'all')
 * search: string matched against title and author   (default '')
 *
 * Rejects with an Error if failNext() was called, or if the filter is not one
 * of the four above — an unknown filter is a bug in your code, and this will
 * tell you so rather than quietly returning nothing.
 */
export function loadBooks({ filter = "all", search = "" } = {}) {
  callCount += 1;

  const delay = DELAYS[filter];

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (failNextCall) {
        failNextCall = false;
        reject(new Error("Catalogue service unavailable (503)"));
        return;
      }

      if (delay === undefined) {
        reject(new Error(`Unknown filter: ${filter}`));
        return;
      }

      const term = search.trim().toLowerCase();

      const results = ALL_BOOKS.filter((book) => {
        const statusOk = filter === "all" || book.status === filter;

        if (!term) return statusOk;

        // Note: author is null on some records. This is the fixture from
        // Friday and it has not been cleaned up for you.
        const haystack =
          `${book.title ?? ""} ${book.author ?? ""}`.toLowerCase();
        return statusOk && haystack.includes(term);
      });

      resolve(results);
    }, delay ?? 0);
  });
}

import { USERS } from "./users.fixture";

export function loadUsers() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(USERS);
    }, 500);
  });
}

import { BORROW_REQUESTS } from "./borrowRequests.fixture";

export function loadBorrowRequests() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(BORROW_REQUESTS);
    }, 500);
  });
}
