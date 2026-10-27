import { ConflictError, NotFoundError } from "../errors/domainErrors.js";
import { DOMAIN_EVENTS } from "../events/domainEvents.js";

const isbnTaken = () =>
  new ConflictError("A book with this ISBN already exists.", {
    details: [{ field: "isbn", message: "ISBN must be unique." }],
  });

const createBooksService = (booksRepository, events) => {
  // the only place that announces an availability change
  const announceAvailability = (book) => {
    events.emit(DOMAIN_EVENTS.BOOK_AVAILABILITY_CHANGED, {
      bookId: book.id,
      available: book.onShelf,
    });
  };

  return {
    list: (query) => booksRepository.findAll(query),

    async getById(id) {
      const book = await booksRepository.findById(id);
      if (!book) {
        throw new NotFoundError("Book not found.");
      }
      return book;
    },

    async create(bookData) {
      const existingBook = await booksRepository.findByIsbn(bookData.isbn);
      if (existingBook) {
        throw isbnTaken();
      }
      return booksRepository.create(bookData);
    },

    async update(id, changes) {
      // check the book exists first, otherwise a missing book with a taken
      // ISBN gave 409 instead of 404
      const before = await this.getById(id);

      if (changes.isbn !== undefined) {
        const duplicate = await booksRepository.findByIsbn(changes.isbn);
        if (duplicate && duplicate.id !== id) {
          throw isbnTaken();
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

    // Every checkout, return and (on Friday) nightly job goes through here.
    async changeAvailability(id, change) {
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

    async delete(id) {
      const deleted = await booksRepository.deleteById(id);
      if (!deleted) {
        throw new NotFoundError("Book not found.");
      }
    },
  };
};

export default createBooksService;
