import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import createBooksService from "../src/services/books.service.ts";
import { createFakeBooksRepository } from "./fakeRepositories.js";

const setUp = (book) => {
  const books = [{ id: "bk-1", title: "Dune", ...book }];
  return {
    books,
    booksService: createBooksService(
      createFakeBooksRepository(books),
      new EventEmitter(),
    ),
  };
};

test("the last copy leaving the shelf marks the book out", async () => {
  const { booksService } = setUp({ onShelf: 1, status: "available" });
  const book = await booksService.changeAvailability("bk-1", -1);
  assert.equal(book.status, "out");
});

test("a copy coming back marks the book available", async () => {
  const { booksService } = setUp({ onShelf: 0, status: "out" });
  const book = await booksService.changeAvailability("bk-1", 1);
  assert.equal(book.status, "available");
});

test("a reserved book keeps its status when copies change", async () => {
  const { booksService } = setUp({ onShelf: 1, status: "RESERVED_STACK" });
  const book = await booksService.changeAvailability("bk-1", -1);
  assert.equal(book.status, "RESERVED_STACK");
});
