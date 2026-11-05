import { z } from "zod";
import { BORROW_REQUEST_STATUSES } from "../types/borrowRequest.ts";

const borrowRequestQuerySchema = z.object({
  userId: z.string().optional(),
  bookId: z.string().optional(),
  status: z.enum(BORROW_REQUEST_STATUSES).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().default(10),
});

// the member comes from the token, everything else is set by the service
const createBorrowRequestSchema = z.object({
  bookId: z.string().min(1),
});

// staff only decide the status; dates and fine are set by the service
const updateBorrowRequestSchema = z.strictObject({
  status: z.enum(["pending", "approved", "rejected"]),
});

export {
  borrowRequestQuerySchema,
  createBorrowRequestSchema,
  updateBorrowRequestSchema,
};

export type CreateBorrowRequestBody = z.infer<typeof createBorrowRequestSchema>;
export type UpdateBorrowRequestBody = z.infer<typeof updateBorrowRequestSchema>;
