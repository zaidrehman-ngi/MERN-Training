import type { NotificationsRepository } from "../repositories/notifications.repository.ts";
import type { Notification } from "../types/notification.ts";
import type { Page } from "../types/page.ts";

const createNotificationsService = (
  notificationsRepository: NotificationsRepository,
) => ({
  async listFor(
    memberId: string,
    { page, limit }: { page: number; limit: number },
  ): Promise<Page<Notification>> {
    const [items, total] = await Promise.all([
      notificationsRepository.findForMember(memberId, { page, limit }),
      notificationsRepository.countForMember(memberId),
    ]);
    return { items, page, limit, total };
  },
});

export type NotificationsService = ReturnType<
  typeof createNotificationsService
>;

export default createNotificationsService;
