import { z } from "zod";

const idParamsSchema = z.object({
  id: z.uuid(),
});

export { idParamsSchema };
