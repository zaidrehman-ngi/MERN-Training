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
  if (value === "due-reminder") {
    return value;
  }
  throw new Error(`Unknown notification kind in the database: ${value}`);
};

const isAlreadySent = (err: unknown): boolean =>
  err instanceof Error && "code" in err && err.code === "P2002";

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
    try {
      const row = await prisma.notifications.create({
        data: {
          kind: notification.kind,
          message: notification.message,
          for_date: new Date(notification.forDate),
          members: { connect: { api_id: notification.memberId } },
          ...(notification.borrowRequestId
            ? {
                book_requests: {
                  connect: { api_id: notification.borrowRequestId },
                },
              }
            : {}),
        },
        select: notificationSelect,
      });
      return toNotification(row);
    } catch (err) {
      if (isAlreadySent(err)) {
        return null;
      }
      throw err;
    }
  },
});

export default createNotificationsRepository;
