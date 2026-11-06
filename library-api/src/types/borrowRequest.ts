import type { Changes } from "./changes.ts";

export const BORROW_REQUEST_STATUSES = [
  "pending",
  "queued",
  "held",
  "approved",
  "rejected",
  "cancelled",
  "expired",
  "returned",
] as const;
export type BorrowRequestStatus = (typeof BORROW_REQUEST_STATUSES)[number];

export type BorrowRequest = {
  id: string;
  bookId: string;
  userId: string;
  status: BorrowRequestStatus;
  requestedAt: string | null;
  dueDate: string | null;
  queuedAt: string | null;
  holdUntil: string | null;
  finePerDay: number;
  returnedAt: string | null;
  // charged when returned; while still out, what it comes to today
  fine: number | null;
  member: { id: string; name: string; email: string | null };
  book: { id: string; title: string; author: string | null };
};

export type BorrowRequestListItem = Omit<BorrowRequest, "member" | "book"> & {
  memberName: string;
  bookTitle: string;
};

export type NewBorrowRequest = {
  userId: string;
  bookId: string;
  status: BorrowRequestStatus;
  requestedAt: string;
  dueDate: string | null;
  queuedAt: string | null;
  holdUntil: string | null;
  finePerDay: number;
};

export type BorrowRequestChanges = Changes<
  NewBorrowRequest & { returnedAt: string | null; fine: number | null }
>;

export type BorrowRequestQuery = {
  userId?: string;
  bookId?: string;
  status?: BorrowRequestStatus;
  page?: number;
  limit?: number;
};
