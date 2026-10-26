import { z } from "zod";

export const helloSchema = z.object({
  text: z.string().trim().min(1).max(200),
});
