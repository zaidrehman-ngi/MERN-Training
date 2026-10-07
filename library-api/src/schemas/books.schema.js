import { z } from "zod";

const createBookSchema = z.object({
  title: z.string().min(1).max(200),
  author: z.string().optional(),
  year: z.number().int().nonnegative(),
  isbn: z.string().regex(/^\d{13}$/, "ISBN must be 13 digits."),
  coverUrl: z.string().optional(),
  onShelf: z.number().int().nonnegative(),
  totalCopies: z.number().int().positive(),
  finePerDay: z.number().int().nonnegative(),
  status: z.enum(["available", "out", "overdue", "RESERVED_STACK"]),
});

// const task2Schema = z.object({
//   title: z.string(),
//   copies: z.number().int().positive(),
// });

const task2Schema = z.object({
  title: z.string(),
  copies: z.coerce.number().int().positive(),
});

// const booksQuerySchema = z.object({
//   page: z.coerce.number().int().positive().default(1),
//   limit: z.coerce.number().int().positive().default(10),
//   filter: z.string().optional(),
//   search: z.string().optional(),
// });

const booksQuerySchema = z.object({
  author: z.string().optional(),
  title: z.string().optional(),
  available: z.enum(["true", "false"]).optional(),
  sort: z.enum(["title", "author", "year"]).optional(),
  order: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});

const bookIdSchema = z.object({
  id: z.string().min(1),
});

const updateBookSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  author: z.string().optional(),
  year: z.number().int().nonnegative().optional(),
  isbn: z
    .string()
    .regex(/^\d{13}$/, "ISBN must be 13 digits.")
    .optional(),
  coverUrl: z.string().optional(),
  onShelf: z.number().int().nonnegative().optional(),
  totalCopies: z.number().int().nonnegative().optional(),
  finePerDay: z.number().int().nonnegative().optional(),
  status: z.enum(["available", "out", "overdue", "RESERVED_STACK"]).optional(),
});

export {
  createBookSchema,
  task2Schema,
  booksQuerySchema,
  bookIdSchema,
  updateBookSchema,
};
