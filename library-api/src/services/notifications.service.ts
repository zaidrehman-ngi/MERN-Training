import type { NotificationsRepository } from "../repositories/notifications.repository.ts";
import type { Notification } from "../types/notification.ts";

const createNotificationsService = (
  notificationsRepository: NotificationsRepository,
) => ({
  // newest first; a member only ever sees their own
  listFor(
    memberId: string,
    { page = 1, limit = 20 }: { page?: number; limit?: number } = {},
  ): Promise<Notification[]> {
    return notificationsRepository.findForMember(memberId, { page, limit });
  },
});

export type NotificationsService = ReturnType<
  typeof createNotificationsService
>;

export default createNotificationsService;
