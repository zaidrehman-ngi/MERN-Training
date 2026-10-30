import { z } from "zod";

const borrowRequestIdSchema = z.object({
  id: z.string().min(1),
});

const borrowRequestStatusSchema = z.enum(["pending", "approved", "rejected"]);

const borrowRequestQuerySchema = z.object({
  userId: z.string().optional(),
  bookId: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected", "returned"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().default(10),
});

// the member comes from the token, everything else is set by the service
const createBorrowRequestSchema = z.object({
  bookId: z.string().min(1),
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

export type CreateBorrowRequestBody = z.infer<typeof createBorrowRequestSchema>;
export type UpdateBorrowRequestBody = z.infer<typeof updateBorrowRequestSchema>;
