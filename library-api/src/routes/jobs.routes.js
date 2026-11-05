import express from "express";
import { runDueReminders } from "../controllers/jobs.controller.ts";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import { ADMIN_ROLES } from "../types/member.ts";

const router = express.Router();

router.post(
  "/due-reminders/run",
  requireAuth,
  requireRole(...ADMIN_ROLES),
  runDueReminders,
);

export default router;
