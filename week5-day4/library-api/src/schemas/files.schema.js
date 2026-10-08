import { z } from "zod";

const filenameSchema = z.object({
  filename: z.string().min(1),
});

export { filenameSchema };
