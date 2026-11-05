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

export type NewBook = Omit<Book, "id" | "author" | "coverUrl"> & {
  author?: string | null | undefined;
  coverUrl?: string | null | undefined;
};

export type BookQuery = {
  author?: string | undefined;
  title?: string | undefined;
  available?: boolean | undefined;
  sort?: "title" | "author" | "year" | undefined;
  order?: "asc" | "desc" | undefined;
  page: number;
  limit: number;
};
