import { z } from "zod";

const borrowRequestIdSchema = z.object({
  id: z.string().min(1),
});

const borrowRequestStatusSchema = z.enum(["pending", "approved", "rejected"]);

const borrowRequestQuerySchema = z.object({
  userId: z.string().optional(),
  bookId: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected", "returned"]).optional(),
});

const createBorrowRequestSchema = z.object({
  userId: z.string().min(1),
  bookId: z.string().min(1),
  status: borrowRequestStatusSchema,
  requestedAt: z.string().min(1),
  dueDate: z.string().min(1),
  finePerDay: z.number().int().nonnegative(),
});

const updateBorrowRequestSchema = z.object({
  userId: z.string().min(1).optional(),
  bookId: z.string().min(1).optional(),
  status: borrowRequestStatusSchema.optional(),
  requestedAt: z.string().min(1).optional(),
  dueDate: z.string().min(1).optional(),
  finePerDay: z.number().int().nonnegative().optional(),
});

export {
  borrowRequestIdSchema,
  borrowRequestQuerySchema,
  createBorrowRequestSchema,
  updateBorrowRequestSchema,
};
