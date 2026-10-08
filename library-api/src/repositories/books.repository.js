const createBooksRepository = (db) => {
  const { books } = db;

  return {
    async findAll({
      author,
      title,
      available,
      sort,
      order,
      page = 1,
      limit = 10,
    }) {
      let result = [...books];

      if (author) {
        result = result.filter((book) => book.author === author);
      }

      if (title) {
        result = result.filter((book) => book.title === title);
      }

      if (available !== undefined) {
        result = result.filter((book) =>
          available === "true" ? book.onShelf > 0 : book.onShelf === 0,
        );
      }

      if (sort) {
        result.sort((a, b) => {
          if (a[sort] < b[sort]) {
            return order === "asc" ? -1 : 1;
          }

          if (a[sort] > b[sort]) {
            return order === "asc" ? 1 : -1;
          }

          return 0;
        });
      }

      const start = (page - 1) * limit;
      return result.slice(start, start + limit);
    },

    async findById(id) {
      return books.find((book) => book.id === id) ?? null;
    },

    async findByIsbn(isbn) {
      return books.find((book) => book.isbn === isbn) ?? null;
    },

    async create(bookData) {
      const book = {
        id: `bk-${books.length + 1}`,
        ...bookData,
      };
      books.push(book);
      return book;
    },

    async updateById(id, changes) {
      const index = books.findIndex((book) => book.id === id);
      if (index === -1) {
        return null;
      }

      books[index] = { ...books[index], ...changes, id };
      return books[index];
    },

    async deleteById(id) {
      const index = books.findIndex((book) => book.id === id);
      if (index === -1) {
        return false;
      }

      books.splice(index, 1);
      return true;
    },
  };
};

export default createBooksRepository;
