export type NotificationKind = "due-reminder" | "hold-ready";

export type Notification = {
  id: string;
  memberId: string;
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
