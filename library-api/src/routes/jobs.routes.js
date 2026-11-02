import express from "express";
import { runDueReminders } from "../controllers/jobs.controller.ts";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.post(
  "/due-reminders/run",
  requireAuth,
  requireRole("admin"),
  runDueReminders,
);

export default router;
