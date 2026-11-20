// Changing a due date and waiving a fine, on fake repositories.
//   npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import createBorrowRequestsService from "../src/services/borrowRequests.service.ts";
import {
  ConflictError,
  InvalidValueError,
} from "../src/errors/domainErrors.ts";
import { createFakeBorrowRequestsRepository } from "./fakeRepositories.js";

// "today" is 2026-11-02 in Karachi
const setUp = (request) => {
  const requests = [
    {
      id: "br-1",
      userId: "m-1",
      bookId: "bk-1",
      finePerDay: 20,
      dueDate: "2026-11-05",
      fine: null,
      ...request,
    },
  ];
  const borrowRequests = createBorrowRequestsService(
    createFakeBorrowRequestsRepository(requests),
    {},
    {},
    new EventEmitter(),
    (work) => work({}),
    {
      loanPeriodDays: 14,
      holdDays: 3,
      defaultFinePerDay: 20,
      fineMaxDays: 30,
      timeZone: "Asia/Karachi",
      now: () => new Date("2026-11-02T02:00:00+05:00"),
    },
  );
  return { borrowRequests, requests };
};

test("staff can move the due date of a book that is out", async () => {
  const { borrowRequests } = setUp({ status: "approved" });

  const request = await borrowRequests.changeDueDate("br-1", "2026-11-12");
  assert.equal(request.dueDate, "2026-11-12");
});

test("a due date can't be moved into the past", async () => {
  const { borrowRequests, requests } = setUp({ status: "approved" });

  await assert.rejects(
    borrowRequests.changeDueDate("br-1", "2026-11-01"),
    InvalidValueError,
  );
  assert.equal(requests[0].dueDate, "2026-11-05");
});

test("only a book that is out gets a new due date", async () => {
  const { borrowRequests } = setUp({ status: "pending", dueDate: null });

  await assert.rejects(
    borrowRequests.changeDueDate("br-1", "2026-11-12"),
    ConflictError,
  );
});

test("an admin can waive the fine on a returned book", async () => {
  const { borrowRequests } = setUp({ status: "returned", fine: 60 });

  const request = await borrowRequests.waiveFine("br-1");
  assert.equal(request.fine, 0);
});

test("there is nothing to waive when the fine is zero or the book is out", async () => {
  for (const request of [
    { status: "returned", fine: 0 },
    { status: "approved", fine: null },
  ]) {
    const { borrowRequests } = setUp(request);
    await assert.rejects(borrowRequests.waiveFine("br-1"), ConflictError);
  }
});
