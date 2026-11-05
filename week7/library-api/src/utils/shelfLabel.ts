import type { Book } from "../types/book.ts";

export const shelfLabel = (book: Book | null): string => {
  if (book === null) {
    return "Not in the catalogue";
  }
  return `${book.title}: ${book.onShelf} of ${book.totalCopies} on the shelf`;
};
