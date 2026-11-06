import { z } from "zod";

export const bookWatchSchema = z.object({
  bookId: z.string().trim().min(1).max(50),
});

export const decideRequestSchema = z.object({
  id: z.string().trim().min(1).max(50),
  status: z.enum(["approved", "rejected"]),
});
