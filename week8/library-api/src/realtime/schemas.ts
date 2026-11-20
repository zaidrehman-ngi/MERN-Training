import { z } from "zod";

export const bookWatchSchema = z.object({
  bookId: z.uuid(),
});

export const decideRequestSchema = z.object({
  id: z.uuid(),
  status: z.enum(["approved", "rejected"]),
});
