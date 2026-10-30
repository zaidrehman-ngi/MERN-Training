import type { Book } from "../types/book.ts";

export const surname = (book: Book): string | null => {
  if (book.author === null) {
    return null;
  }
  const parts = book.author.trim().split(/\s+/);
  return parts.at(-1) || null;
};
