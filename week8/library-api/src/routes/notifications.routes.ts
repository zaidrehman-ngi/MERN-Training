import express from "express";
import { getMyNotifications } from "../controllers/notifications.controller.ts";
import requireAuth from "../middleware/requireAuth.ts";
import validate from "../middleware/validate.ts";
import { notificationQuerySchema } from "../schemas/notifications.schema.ts";

const router = express.Router();

router.get(
  "/",
  requireAuth,
  validate(notificationQuerySchema, "query"),
  getMyNotifications,
);

export default router;
