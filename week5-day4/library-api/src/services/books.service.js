import { conflict, notFound } from "../errors/ApiError.js";

const createBooksService = (booksRepository) => ({
  list: (query) => booksRepository.findAll(query),

  async getById(id) {
    const book = await booksRepository.findById(id);
    if (!book) {
      throw notFound("Book not found.");
    }
    return book;
  },

  async create(bookData) {
    const existingBook = await booksRepository.findByIsbn(bookData.isbn);
    if (existingBook) {
      throw conflict("A book with this ISBN already exists.", [
        {
          field: "isbn",
          message: "ISBN must be unique.",
        },
      ]);
    }
    return booksRepository.create(bookData);
  },

  async update(id, changes) {
    if (changes.isbn !== undefined) {
      const duplicate = await booksRepository.findByIsbn(changes.isbn);
      if (duplicate && duplicate.id !== id) {
        throw conflict("A book with this ISBN already exists.", [
          {
            field: "isbn",
            message: "ISBN must be unique.",
          },
        ]);
      }
    }

    const book = await booksRepository.updateById(id, changes);
    if (!book) {
      throw notFound("Book not found.");
    }
    return book;
  },

  async delete(id) {
    const deleted = await booksRepository.deleteById(id);
    if (!deleted) {
      throw notFound("Book not found.");
    }
  },
});

export default createBooksService;
