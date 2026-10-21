// Turns a row from the books table into the same book shape the API
// returned when the data came from db.json.
const toBook = (row) => ({
  id: row.api_id,
  title: row.title,
  author: row.author,
  year: row.publication_year,
  isbn: row.isbn,
  coverUrl: row.cover_url,
  onShelf: row.available_copies,
  totalCopies: row.total_copies,
  finePerDay: row.fine_per_day,
  status: row.status,
});

// API field names -> column names, for create and update.
const toRow = (book) => ({
  title: book.title,
  author: book.author,
  publication_year: book.year,
  isbn: book.isbn,
  cover_url: book.coverUrl,
  available_copies: book.onShelf,
  total_copies: book.totalCopies,
  fine_per_day: book.finePerDay,
  status: book.status,
});

const sortColumns = {
  title: "title",
  author: "author",
  year: "publication_year",
};

const createBooksRepository = (prisma) => ({
  async findAll({
    author,
    title,
    available,
    sort,
    order,
    page = 1,
    limit = 10,
  }) {
    const where = { is_active: true };

    if (author) {
      where.author = author;
    }

    if (title) {
      where.title = title;
    }

    if (available !== undefined) {
      where.available_copies = available === "true" ? { gt: 0 } : 0;
    }

    // author and year can be empty, keep those books at the end of the list
    let orderBy;
    if (sort === "title") {
      orderBy = { title: order };
    } else if (sort) {
      orderBy = { [sortColumns[sort]]: { sort: order, nulls: "last" } };
    }

    const rows = await prisma.books.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    return rows.map(toBook);
  },

  async findById(id) {
    const row = await prisma.books.findFirst({
      where: { api_id: id, is_active: true },
    });
    return row ? toBook(row) : null;
  },

  async findByIsbn(isbn) {
    const row = await prisma.books.findFirst({
      where: { isbn, is_active: true },
    });
    return row ? toBook(row) : null;
  },

  async create(bookData) {
    const row = await prisma.books.create({ data: toRow(bookData) });
    return toBook(row);
  },

  async updateById(id, changes) {
    const existing = await prisma.books.findFirst({
      where: { api_id: id, is_active: true },
    });
    if (!existing) {
      return null;
    }

    const row = await prisma.books.update({
      where: { book_id: existing.book_id },
      data: toRow(changes),
    });
    return toBook(row);
  },

  // Soft delete: a book with loan history can't be removed from the table,
  // so it is marked inactive and stops showing up in the API.
  async deleteById(id) {
    const result = await prisma.books.updateMany({
      where: { api_id: id, is_active: true },
      data: { is_active: false },
    });
    return result.count > 0;
  },
});

export default createBooksRepository;
