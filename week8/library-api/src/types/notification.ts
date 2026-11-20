export const NOTIFICATION_KINDS = ["due-reminder", "hold-ready"] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export type Notification = {
  id: string;
  userId: string;
  borrowRequestId: string | null;
  kind: NotificationKind;
  message: string;
  forDate: string;
  createdAt: string;
};

export type NewNotification = {
  memberId: string;
  borrowRequestId: string | null;
  kind: NotificationKind;
  message: string;
  forDate: string;
};
