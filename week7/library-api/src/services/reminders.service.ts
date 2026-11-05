import type { BorrowRequestsService } from "./borrowRequests.service.ts";
import type { NotificationsRepository } from "../repositories/notifications.repository.ts";
import { addDays, todayIn } from "../utils/dates.ts";

export const REMINDER_DAYS_BEFORE = 2;

export type RemindersOptions = {
  timeZone: string;
  now?: () => Date;
  log: (message: string) => void;
  logError: (message: string, err: unknown) => void;
};

export type ReminderRun = {
  dueOn: string;
  found: number;
  sent: number;
  alreadySent: number;
  failed: number;
};

const createRemindersService = (
  borrowRequestsService: Pick<BorrowRequestsService, "findDueOn">,
  notificationsRepository: NotificationsRepository,
  options: RemindersOptions,
) => ({
  async sendDueReminders(): Promise<ReminderRun> {
    const today = todayIn(
      options.timeZone,
      options.now ? options.now() : new Date(),
    );
    const dueOn = addDays(today, REMINDER_DAYS_BEFORE);
    const loans = await borrowRequestsService.findDueOn(dueOn);
    let sent = 0;
    let alreadySent = 0;
    let failed = 0;

    for (const loan of loans) {
      const message = `"${loan.book.title}" is due back on ${dueOn}.`;
      let notification;
      try {
        notification = await notificationsRepository.createOnce({
          memberId: loan.userId,
          borrowRequestId: loan.id,
          kind: "due-reminder",
          message,
          forDate: dueOn,
        });
      } catch (err) {
        failed += 1;
        options.logError(
          `[due-reminders] could not remind about ${loan.id}:`,
          err,
        );
        continue;
      }
      if (!notification) {
        alreadySent += 1;
        options.log(
          `[due-reminders] ${loan.id} already reminded for ${dueOn}, skipped`,
        );
        continue;
      }
      sent += 1;
      options.log(
        `[due-reminders] reminded ${loan.member.name} (${loan.userId}) about ${loan.id}: ${message}`,
      );
    }

    return { dueOn, found: loans.length, sent, alreadySent, failed };
  },
});

export type RemindersService = ReturnType<typeof createRemindersService>;

export default createRemindersService;
