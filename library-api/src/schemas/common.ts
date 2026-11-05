import { z } from "zod";

const idParamsSchema = z.object({
  id: z.string().min(1),
});

export { idParamsSchema };
