const getBooks = async (req, res) => {
  const books = await req.app.locals.services.books.list(req.query);
  res.status(200).json({ data: books });
};

const getBookById = async (req, res) => {
  const book = await req.app.locals.services.books.getById(req.params.id);
  res.status(200).json(book);
};

const createBook = async (req, res) => {
  const book = await req.app.locals.services.books.create(req.body);
  res.status(201).location(`/api/v1/books/${book.id}`).json({ data: book });
};

const updateBook = async (req, res) => {
  const book = await req.app.locals.services.books.update(
    req.params.id,
    req.body,
  );
  res.status(200).json({ data: book });
};

const deleteBook = async (req, res) => {
  await req.app.locals.services.books.delete(req.params.id);
  res.status(204).send();
};

export { getBooks, getBookById, createBook, updateBook, deleteBook };
