import { z } from "zod";
import { pageQuery } from "./common.ts";

const notificationQuerySchema = z.strictObject(pageQuery);

export { notificationQuerySchema };

export type NotificationQuery = z.infer<typeof notificationQuerySchema>;
