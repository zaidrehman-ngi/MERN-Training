import {
  ConflictError,
  IsbnTakenError,
  NotFoundError,
} from "../errors/domainErrors.ts";
import { DOMAIN_EVENTS } from "../events/domainEvents.ts";
import type { BooksRepository } from "../repositories/books.repository.ts";
import type { Book, BookQuery, BookStatus, NewBook } from "../types/book.ts";
import type { Page } from "../types/page.ts";
import type { Changes } from "../types/changes.ts";
import type { Events } from "../types/events.ts";

const PAGE_SIZE = 10;

const statusForShelf = (book: Book): BookStatus => {
  if (book.status !== "available" && book.status !== "out") {
    return book.status;
  }
  return book.onShelf > 0 ? "available" : "out";
};

const createBooksService = (
  booksRepository: BooksRepository,
  events: Events,
) => {
  const syncStatus = async (book: Book): Promise<Book> => {
    const status = statusForShelf(book);
    if (status === book.status) {
      return book;
    }
    return (await booksRepository.updateById(book.id, { status })) ?? book;
  };

  const announceAvailability = (book: Book) => {
    events.emit(DOMAIN_EVENTS.BOOK_AVAILABILITY_CHANGED, {
      bookId: book.id,
      available: book.onShelf,
    });
  };

  return {
    async list({
      page = 1,
      limit = PAGE_SIZE,
      ...filters
    }: Partial<BookQuery> = {}): Promise<Page<Book>> {
      const query = { ...filters, page, limit };
      const [items, total] = await Promise.all([
        booksRepository.findAll(query),
        booksRepository.count(query),
      ]);
      return { items, page, limit, total };
    },

    async getById(id: string): Promise<Book> {
      const book = await booksRepository.findById(id);
      if (!book) {
        throw new NotFoundError("Book not found.");
      }
      return book;
    },

    async create(bookData: NewBook): Promise<Book> {
      const existingBook = bookData.isbn
        ? await booksRepository.findByIsbn(bookData.isbn)
        : null;
      if (existingBook) {
        throw new IsbnTakenError();
      }
      return syncStatus(await booksRepository.create(bookData));
    },

    async update(id: string, changes: Changes<NewBook>): Promise<Book> {
      // 404 before 409: a missing book with a taken ISBN is still a 404
      const before = await this.getById(id);

      if (changes.isbn) {
        const duplicate = await booksRepository.findByIsbn(changes.isbn);
        if (duplicate && duplicate.id !== id) {
          throw new IsbnTakenError();
        }
      }

      const updated = await booksRepository.updateById(id, changes);
      if (!updated) {
        throw new NotFoundError("Book not found.");
      }
      const book = await syncStatus(updated);
      if (book.onShelf !== before.onShelf) {
        announceAvailability(book);
      }
      return book;
    },

    async changeAvailability(id: string, change: number): Promise<Book> {
      const before = await this.getById(id);
      if (before.onShelf + change < 0) {
        throw new ConflictError("No copies of this book are available.", {
          code: "NO_COPIES_AVAILABLE",
        });
      }

      const changed = await booksRepository.changeAvailableCopies(id, change);
      if (!changed) {
        throw new NotFoundError("Book not found.");
      }
      const book = await syncStatus(changed);
      announceAvailability(book);
      return book;
    },

    async delete(id: string): Promise<void> {
      const deleted = await booksRepository.deleteById(id);
      if (!deleted) {
        throw new NotFoundError("Book not found.");
      }
    },
  };
};

export type BooksService = ReturnType<typeof createBooksService>;

export default createBooksService;
