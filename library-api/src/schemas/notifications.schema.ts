import { z } from "zod";

const notificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export { notificationQuerySchema };

export type NotificationQuery = z.infer<typeof notificationQuerySchema>;
