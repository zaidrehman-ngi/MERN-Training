import { z } from "zod";

export const bookWatchSchema = z.object({
  bookId: z.string().trim().min(1).max(50),
});

export const helloSchema = z.object({
  text: z.string().trim().min(1).max(200),
});
