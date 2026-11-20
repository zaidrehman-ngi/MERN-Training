import cron from "node-cron";
import type { ScheduledTask } from "node-cron";
import config from "../config/config.ts";
import logger from "../config/logger.ts";
import type { Services } from "../services/createServices.ts";
import { runJob } from "./runJob.ts";
import type { JobResult } from "./runJob.ts";

const schedule = (
  name: string,
  expression: string,
  work: () => Promise<JobResult>,
): ScheduledTask => {
  const task = cron.schedule(expression, () => runJob(name, work, logger), {
    name,
    timezone: config.libraryTimeZone,
    noOverlap: true,
  });
  logger.info(
    `[${name}] scheduled "${expression}" (${config.libraryTimeZone}), next run ${task.getNextRun()?.toISOString()}`,
  );
  return task;
};

export const startJobs = (services: Services): ScheduledTask[] => [
  schedule("expire-holds", config.holdExpirySchedule, () =>
    services.borrowRequests.expireHolds(),
  ),
  schedule("due-reminders", config.dueReminderSchedule, () =>
    services.reminders.sendDueReminders(),
  ),
];
