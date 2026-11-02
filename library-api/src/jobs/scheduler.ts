import cron from "node-cron";
import type { ScheduledTask } from "node-cron";
import config from "../config/config.js";
import logger from "../config/logger.js";
import type { Services } from "../controllers/services.ts";
import { runJob } from "./runJob.ts";

export const startJobs = (services: Services): ScheduledTask[] => {
  const dueReminders = cron.schedule(
    config.dueReminderSchedule,
    () =>
      runJob(
        "due-reminders",
        () => services.reminders.sendDueReminders(),
        logger,
      ),
    {
      name: "due-reminders",
      timezone: config.libraryTimeZone,
      noOverlap: true,
    },
  );

  logger.info(
    `[due-reminders] scheduled "${config.dueReminderSchedule}" (${config.libraryTimeZone}), next run ${dueReminders.getNextRun()?.toISOString()}`,
  );
  return [dueReminders];
};
