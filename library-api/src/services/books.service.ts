import {
  ConflictError,
  IsbnTakenError,
  NotFoundError,
} from "../errors/domainErrors.ts";
import { DOMAIN_EVENTS } from "../events/domainEvents.js";
import type { BooksRepository } from "../repositories/books.repository.ts";
import type { Book, BookQuery, NewBook } from "../types/book.ts";
import type { Changes } from "../types/changes.ts";
import type { Events } from "../types/events.ts";

const PAGE_SIZE = 10;

const createBooksService = (
  booksRepository: BooksRepository,
  events: Events,
) => {
  // the only place that announces an availability change
  const announceAvailability = (book: Book) => {
    events.emit(DOMAIN_EVENTS.BOOK_AVAILABILITY_CHANGED, {
      bookId: book.id,
      available: book.onShelf,
    });
  };

  return {
    list: ({
      page = 1,
      limit = PAGE_SIZE,
      ...filters
    }: Partial<BookQuery> = {}): Promise<Book[]> =>
      booksRepository.findAll({ ...filters, page, limit }),

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
      return booksRepository.create(bookData);
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

      const book = await booksRepository.updateById(id, changes);
      if (!book) {
        throw new NotFoundError("Book not found.");
      }
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

      const book = await booksRepository.changeAvailableCopies(id, change);
      if (!book) {
        throw new NotFoundError("Book not found.");
      }
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
