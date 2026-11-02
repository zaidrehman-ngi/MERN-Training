import type { Prisma, books } from "../generated/prisma/client.ts";
import { IsbnTakenError } from "../errors/domainErrors.js";
import translateDbError from "./dbErrors.js";
import type { DeletableRepository } from "./repository.ts";
import type { Changes } from "../types/changes.ts";
import type { Book, BookQuery, BookStatus, NewBook } from "../types/book.ts";

type Db = Prisma.TransactionClient;

export interface BooksRepository extends DeletableRepository<
  Book,
  NewBook,
  BookQuery
> {
  findByIsbn(isbn: string): Promise<Book | null>;
  changeAvailableCopies(id: string, change: number): Promise<Book | null>;
}

const toBookStatus = (value: string): BookStatus => {
  if (
    value === "available" ||
    value === "out" ||
    value === "overdue" ||
    value === "RESERVED_STACK"
  ) {
    return value;
  }
  throw new Error(`Unknown book status in the database: ${value}`);
};

// Turns a row from the books table into the same book shape the API
// returned when the data came from db.json.
const toBook = (row: books): Book => ({
  id: row.api_id,
  title: row.title,
  author: row.author,
  year: row.publication_year,
  isbn: row.isbn,
  coverUrl: row.cover_url,
  onShelf: row.available_copies,
  totalCopies: row.total_copies,
  finePerDay: row.fine_per_day,
  status: toBookStatus(row.status),
});

// API field names -> column names, for create and update.
const toCreateRow = (book: NewBook): Prisma.booksUncheckedCreateInput => ({
  title: book.title,
  author: book.author ?? null,
  publication_year: book.year,
  isbn: book.isbn,
  cover_url: book.coverUrl ?? null,
  available_copies: book.onShelf,
  total_copies: book.totalCopies,
  fine_per_day: book.finePerDay,
  status: book.status,
});

const toUpdateRow = (
  changes: Changes<NewBook>,
): Prisma.booksUncheckedUpdateInput => {
  const row: Prisma.booksUncheckedUpdateInput = {};
  if (changes.title !== undefined) row.title = changes.title;
  if (changes.author !== undefined) row.author = changes.author;
  if (changes.year !== undefined) row.publication_year = changes.year;
  if (changes.isbn !== undefined) row.isbn = changes.isbn;
  if (changes.coverUrl !== undefined) row.cover_url = changes.coverUrl;
  if (changes.onShelf !== undefined) row.available_copies = changes.onShelf;
  if (changes.totalCopies !== undefined) row.total_copies = changes.totalCopies;
  if (changes.finePerDay !== undefined) row.fine_per_day = changes.finePerDay;
  if (changes.status !== undefined) row.status = changes.status;
  return row;
};

const translateWriteError = (err: unknown) =>
  translateDbError(err, {
    books_active_isbn_unique: () => new IsbnTakenError(),
  });

const toOrderBy = (
  sort: BookQuery["sort"],
  order: "asc" | "desc",
): Prisma.booksOrderByWithRelationInput | undefined => {
  if (sort === "title") {
    return { title: order };
  }
  // author and year can be empty, keep those books at the end of the list
  if (sort === "author") {
    return { author: { sort: order, nulls: "last" } };
  }
  if (sort === "year") {
    return { publication_year: { sort: order, nulls: "last" } };
  }
  return undefined;
};

const createBooksRepository = (prisma: Db): BooksRepository => ({
  async findAll({
    author,
    title,
    available,
    sort,
    order = "asc",
    page,
    limit,
  }: BookQuery): Promise<Book[]> {
    const where: Prisma.booksWhereInput = { is_active: true };

    if (author) {
      where.author = author;
    }

    if (title) {
      where.title = title;
    }

    if (available !== undefined) {
      where.available_copies = available ? { gt: 0 } : 0;
    }

    const orderBy = toOrderBy(sort, order);
    const rows = await prisma.books.findMany({
      where,
      ...(orderBy ? { orderBy } : {}),
      skip: (page - 1) * limit,
      take: limit,
    });

    return rows.map(toBook);
  },

  async findById(id: string): Promise<Book | null> {
    const row = await prisma.books.findFirst({
      where: { api_id: id, is_active: true },
    });
    return row ? toBook(row) : null;
  },

  async findByIsbn(isbn: string): Promise<Book | null> {
    const row = await prisma.books.findFirst({
      where: { isbn, is_active: true },
    });
    return row ? toBook(row) : null;
  },

  async create(bookData: NewBook): Promise<Book> {
    try {
      const row = await prisma.books.create({ data: toCreateRow(bookData) });
      return toBook(row);
    } catch (err) {
      throw translateWriteError(err);
    }
  },

  async updateById(
    id: string,
    changes: Changes<NewBook>,
  ): Promise<Book | null> {
    const existing = await prisma.books.findFirst({
      where: { api_id: id, is_active: true },
    });
    if (!existing) {
      return null;
    }

    try {
      const row = await prisma.books.update({
        where: { book_id: existing.book_id },
        data: toUpdateRow(changes),
      });
      return toBook(row);
    } catch (err) {
      throw translateWriteError(err);
    }
  },

  // Adds (or with a negative number, takes away) available copies.
  // The CHECK (available_copies >= 0) stops it going below zero.
  async changeAvailableCopies(
    id: string,
    change: number,
  ): Promise<Book | null> {
    const existing = await prisma.books.findFirst({
      where: { api_id: id, is_active: true },
      select: { book_id: true },
    });
    if (!existing) {
      return null;
    }

    try {
      const row = await prisma.books.update({
        where: { book_id: existing.book_id },
        data: { available_copies: { increment: change } },
      });
      return toBook(row);
    } catch (err) {
      throw translateWriteError(err);
    }
  },

  // Soft delete: a book with loan history can't be removed from the table,
  // so it is marked inactive and stops showing up in the API.
  async deleteById(id: string): Promise<boolean> {
    const result = await prisma.books.updateMany({
      where: { api_id: id, is_active: true },
      data: { is_active: false },
    });
    return result.count > 0;
  },
});

export default createBooksRepository;
