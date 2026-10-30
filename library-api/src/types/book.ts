export type BookStatus = "available" | "out" | "overdue" | "RESERVED_STACK";

export type Book = {
  id: string;
  title: string;
  author: string | null;
  year: number | null;
  isbn: string | null;
  coverUrl: string | null;
  onShelf: number;
  totalCopies: number;
  finePerDay: number | null;
  status: BookStatus;
};
