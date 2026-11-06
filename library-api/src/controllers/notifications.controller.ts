import type { Request, Response } from "express";
import { servicesFor } from "./services.ts";
import { actorOf } from "./actor.ts";
import type { NotificationQuery } from "../schemas/notifications.schema.ts";

const getMyNotifications = async (req: Request, res: Response) => {
  const notifications = await servicesFor(req).notifications.listFor(
    actorOf(req).id,
    req.query as unknown as NotificationQuery,
  );
  res.status(200).json({ data: notifications });
};

export { getMyNotifications };
