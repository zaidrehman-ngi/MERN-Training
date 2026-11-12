import { z } from "zod";
import { BORROW_REQUEST_STATUSES } from "../types/borrowRequest.ts";
import { pageQuery } from "./common.ts";

const borrowRequestQuerySchema = z.strictObject({
  q: z.string().trim().min(1).optional(),
  userId: z.uuid().optional(),
  bookId: z.uuid().optional(),
  status: z.enum(BORROW_REQUEST_STATUSES).optional(),
  ...pageQuery,
});

// the member comes from the token, everything else is set by the service
const createBorrowRequestSchema = z.object({
  bookId: z.uuid(),
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
