import type { Prisma } from "../generated/prisma/client.ts";
import type {
  NewNotification,
  Notification,
  NotificationKind,
} from "../types/notification.ts";

type Db = Prisma.TransactionClient;

export interface NotificationsRepository {
  createOnce(notification: NewNotification): Promise<Notification | null>;
}

const notificationSelect = {
  notification_id: true,
  kind: true,
  message: true,
  for_date: true,
  created_at: true,
  members: { select: { api_id: true } },
  book_requests: { select: { api_id: true } },
} satisfies Prisma.notificationsSelect;

type NotificationRow = Prisma.notificationsGetPayload<{
  select: typeof notificationSelect;
}>;

const toKind = (value: string): NotificationKind => {
  if (value === "due-reminder" || value === "hold-ready") {
    return value;
  }
  throw new Error(`Unknown notification kind in the database: ${value}`);
};

const toNotification = (row: NotificationRow): Notification => ({
  id: row.notification_id,
  memberId: row.members.api_id,
  borrowRequestId: row.book_requests?.api_id ?? null,
  kind: toKind(row.kind),
  message: row.message,
  forDate: row.for_date.toISOString().slice(0, 10),
  createdAt: row.created_at.toISOString(),
});

const createNotificationsRepository = (
  prisma: Db,
): NotificationsRepository => ({
  async createOnce(notification) {
    const rows = await prisma.$queryRaw<{ notification_id: string }[]>`
      INSERT INTO notifications (member_id, request_id, kind, message, for_date)
      SELECT m.member_id, r.request_id, ${notification.kind}, ${notification.message}, ${notification.forDate}::date
      FROM members m
      LEFT JOIN book_requests r ON r.api_id = ${notification.borrowRequestId}
      WHERE m.api_id = ${notification.memberId}
      ON CONFLICT (request_id, kind, for_date) DO NOTHING
      RETURNING notification_id`;
    const inserted = rows[0];
    if (!inserted) {
      return null;
    }
    const row = await prisma.notifications.findUniqueOrThrow({
      where: { notification_id: inserted.notification_id },
      select: notificationSelect,
    });
    return toNotification(row);
  },
});

export default createNotificationsRepository;
