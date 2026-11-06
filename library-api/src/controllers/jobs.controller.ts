import type { Request, Response } from "express";
import { servicesFor } from "./services.ts";
import { runJob } from "../jobs/runJob.ts";
import logger from "../config/logger.ts";

const runDueReminders = async (req: Request, res: Response) => {
  const result = await runJob(
    `due-reminders (run by hand by ${req.user?.sub ?? "unknown"})`,
    () => servicesFor(req).reminders.sendDueReminders(),
    logger,
  );

  if (!result) {
    res.status(500).json({
      error: "JOB_FAILED",
      message: "The job failed. The error is in the server log.",
      details: [],
    });
    return;
  }

  res.status(200).json({ data: result });
};

export { runDueReminders };
