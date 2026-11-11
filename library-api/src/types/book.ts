export const BOOK_STATUSES = [
  "available",
  "out",
  "overdue",
  "RESERVED_STACK",
] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

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

export type NewBook = Omit<Book, "id" | "author" | "coverUrl"> & {
  author?: string | null | undefined;
  coverUrl?: string | null | undefined;
};

export type BookQuery = {
  q?: string | undefined;
  status?: BookStatus | undefined;
  author?: string | undefined;
  title?: string | undefined;
  available?: boolean | undefined;
  sort?: "title" | "author" | "year" | undefined;
  order?: "asc" | "desc" | undefined;
  page: number;
  limit: number;
};
