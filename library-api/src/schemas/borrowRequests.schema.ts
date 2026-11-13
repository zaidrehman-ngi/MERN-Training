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

// staff either decide the status or move the due date of a loan
const updateBorrowRequestSchema = z.union(
  [
    z.strictObject({
      status: z.enum(["pending", "approved", "rejected"]),
    }),
    z.strictObject({
      dueDate: z.iso.date(),
    }),
  ],
  { error: "Send either a status or a new dueDate." },
);

export {
  borrowRequestQuerySchema,
  createBorrowRequestSchema,
  updateBorrowRequestSchema,
};

export type CreateBorrowRequestBody = z.infer<typeof createBorrowRequestSchema>;
export type UpdateBorrowRequestBody = z.infer<typeof updateBorrowRequestSchema>;
