import { z } from "zod";

const idParamsSchema = z.object({
  id: z.uuid(),
});

const pageQuery = {
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
};

export { idParamsSchema, pageQuery };
