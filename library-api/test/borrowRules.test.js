// The borrow rules, run on fake repositories. No database needed.
//   npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import createBooksService from "../src/services/books.service.js";
import createUsersService from "../src/services/users.service.js";
import createBorrowRequestsService from "../src/services/borrowRequests.service.js";
import { BorrowLimitReachedError } from "../src/errors/domainErrors.js";
import {
  createFakeBooksRepository,
  createFakeUsersRepository,
  createFakeBorrowRequestsRepository,
} from "./fakeRepositories.js";

// a member with `out` books already approved
const setUp = (out) => {
  const books = [
    { id: "bk-1", title: "Dune", onShelf: 3, finePerDay: 20 },
    { id: "bk-2", title: "Hyperion", onShelf: 2, finePerDay: 25 },
  ];
  const users = [{ id: "m-1", name: "Sara Malik", role: "user" }];
  const requests = Array.from({ length: out }, (_, i) => ({
    id: `br-${i + 1}`,
    userId: "m-1",
    bookId: "bk-1",
    status: "approved",
  }));

  const events = new EventEmitter();
  const booksService = createBooksService(createFakeBooksRepository(books), events);
  const usersService = createUsersService(createFakeUsersRepository(users));
  const borrowRequestsRepository = createFakeBorrowRequestsRepository(requests);

  // no real transaction: just run the work with the same fakes
  let borrowRequests;
  const transaction = (work) =>
    work({
      services: { books: booksService, borrowRequests },
      repositories: { borrowRequests: borrowRequestsRepository },
    });

  borrowRequests = createBorrowRequestsService(
    borrowRequestsRepository,
    booksService,
    usersService,
    events,
    transaction,
  );
  return { borrowRequests, requests };
};

test("a member with five books out can't borrow a sixth", async () => {
  const { borrowRequests, requests } = setUp(5);

  await assert.rejects(
    borrowRequests.create("m-1", "bk-2"),
    BorrowLimitReachedError,
  );
  assert.equal(requests.length, 5); // nothing was saved
});

test("a member with four books out can borrow a fifth", async () => {
  const { borrowRequests } = setUp(4);

  const request = await borrowRequests.create("m-1", "bk-2");
  assert.equal(request.status, "pending");
  assert.equal(request.finePerDay, 25); // from the book, not the caller
});

test("returned books don't count against the limit", async () => {
  const { borrowRequests, requests } = setUp(5);
  requests.forEach((r) => {
    r.status = "returned";
  });

  const request = await borrowRequests.create("m-1", "bk-2");
  assert.equal(request.status, "pending");
});
