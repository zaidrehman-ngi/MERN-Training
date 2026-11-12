import { z } from "zod";
import { BOOK_STATUSES } from "../types/book.ts";
import { pageQuery } from "./common.ts";

const isbn = z.string().regex(/^\d{13}$/, "ISBN must be 13 digits.");

const createBookSchema = z.object({
  title: z.string().min(1).max(200),
  author: z.string().optional(),
  year: z.number().int().nonnegative(),
  isbn,
  coverUrl: z.string().optional(),
  onShelf: z.number().int().nonnegative(),
  totalCopies: z.number().int().positive(),
  finePerDay: z.number().int().nonnegative(),
  status: z.enum(BOOK_STATUSES),
});

const updateBookSchema = createBookSchema.partial();

const booksQuerySchema = z.strictObject({
  q: z.string().trim().min(1).optional(),
  status: z.enum(BOOK_STATUSES).optional(),
  author: z.string().optional(),
  title: z.string().optional(),
  available: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  sort: z.enum(["title", "author", "year"]).optional(),
  order: z.enum(["asc", "desc"]).default("asc"),
  ...pageQuery,
});

export { createBookSchema, updateBookSchema, booksQuerySchema };

export type CreateBookBody = z.infer<typeof createBookSchema>;
export type UpdateBookBody = z.infer<typeof updateBookSchema>;
