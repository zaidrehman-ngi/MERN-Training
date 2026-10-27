import { z } from "zod";

export const bookWatchSchema = z.object({
  bookId: z.string().trim().min(1).max(50),
});

export const decideRequestSchema = z.object({
  id: z.string().trim().min(1).max(50),
  status: z.enum(["approved", "rejected"]),
});

export const helloSchema = z.object({
  text: z.string().trim().min(1).max(200),
});

export const demoSendSchema = z.object({
  mode: z.enum(["only-me", "everyone", "everyone-else"]),
});
