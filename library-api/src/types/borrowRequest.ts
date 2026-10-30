import type { Changes } from "./changes.ts";

export type BorrowRequestStatus =
  "pending" | "approved" | "rejected" | "returned";

export type BorrowRequest = {
  id: string;
  bookId: string;
  userId: string;
  status: BorrowRequestStatus;
  requestedAt: string | null;
  dueDate: string | null;
  finePerDay: number;
  member: { id: string; name: string; email: string };
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
  dueDate: string;
  finePerDay: number;
};

export type BorrowRequestChanges = Changes<NewBorrowRequest>;

export type BorrowRequestQuery = {
  userId?: string;
  bookId?: string;
  status?: BorrowRequestStatus;
  page?: number;
  limit?: number;
};
