const getBooks = (req, res) => {
  const { books } = req.app.locals.db;

  let result = [...books];

  const { author, title, available, sort, order, page, limit } = req.query;

  // Filters
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

  // Sorting
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

  // Pagination
  const pageNumber = page;
  const limitNumber = limit;

  const start = (pageNumber - 1) * limitNumber;
  const paginatedResult = result.slice(start, start + limitNumber);

  res.status(200).json({
    data: paginatedResult,
  });
};

const getBookById = (req, res) => {
  const { books } = req.app.locals.db;

  const book = books.find((book) => book.id === req.params.id);

  if (!book) {
    return res.status(404).json({
      error: "NOT_FOUND",
      message: "Book not found.",
      details: [],
    });
  }

  res.status(200).json(book);
};

const createBook = (req, res) => {
  const { books } = req.app.locals.db;

  const {
    title,
    author,
    isbn,
    year,
    coverUrl,
    onShelf,
    totalCopies,
    finePerDay,
    status,
  } = req.body;

  const existingBook = books.find((book) => book.isbn === isbn);

  if (existingBook) {
    return res.status(409).json({
      error: "CONFLICT",
      message: "A book with this ISBN already exists.",
      details: [
        {
          field: "isbn",
          message: "ISBN must be unique.",
        },
      ],
    });
  }

  const newBook = {
    id: `bk-${books.length + 1}`,
    title,
    author,
    year,
    isbn,
    coverUrl,
    onShelf,
    totalCopies,
    finePerDay,
    status,
  };

  books.push(newBook);

  res.status(201).location(`/api/v1/books/${newBook.id}`).json({
    data: newBook,
  });
};

// Task 2 - saves the original request body
// const testRawBody = (req, res) => {
//   const saved = req.body;

//   res.status(200).json({
//     saved,
//   });
// };

// Task 2 - saves the validated result
// const testValidatedBody = (req, res) => {
//   const result = task2Schema.safeParse(req.body);

//   if (!result.success) {
//     return res.status(400).json({
//       error: "VALIDATION_ERROR",
//       message: "Validation failed.",
//       details: result.error.issues.map((issue) => ({
//         field: issue.path[0],
//         message: issue.message,
//       })),
//     });
//   }

//   const saved = result.data;

//   res.status(200).json({
//     saved,
//   });
// };

// const testBooksQuery = (req, res) => {
//   const result = booksQuerySchema.safeParse(req.query);

//   if (!result.success) {
//     return res.status(400).json({
//       error: "VALIDATION_ERROR",
//       message: "Invalid query parameters.",
//       details: result.error.issues,
//     });
//   }

//   res.json({
//     query: result.data,
//   });
// };

// const testBookId = (req, res) => {
//   const result = bookIdSchema.safeParse(req.params);

//   if (!result.success) {
//     return res.status(400).json({
//       error: "VALIDATION_ERROR",
//       message: "Invalid book ID.",
//       details: result.error.issues,
//     });
//   }

//   res.status(200).json({
//     params: result.data,
//   });
// };

const updateBook = (req, res) => {
  const { books } = req.app.locals.db;

  const index = books.findIndex((book) => book.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      error: "NOT_FOUND",
      message: "Book not found.",
      details: [],
    });
  }

  const {
    title,
    author,
    isbn,
    year,
    coverUrl,
    onShelf,
    totalCopies,
    finePerDay,
    status,
  } = req.body;

  if (isbn !== undefined) {
    const duplicate = books.find(
      (book) => book.isbn === isbn && book.id !== req.params.id,
    );

    if (duplicate) {
      return res.status(409).json({
        error: "CONFLICT",
        message: "A book with this ISBN already exists.",
        details: [
          {
            field: "isbn",
            message: "ISBN must be unique.",
          },
        ],
      });
    }
  }

  books[index] = {
    ...books[index],
    ...(title !== undefined && { title }),
    ...(author !== undefined && { author }),
    ...(isbn !== undefined && { isbn }),
    ...(year !== undefined && { year }),
    ...(coverUrl !== undefined && { coverUrl }),
    ...(onShelf !== undefined && { onShelf }),
    ...(totalCopies !== undefined && { totalCopies }),
    ...(finePerDay !== undefined && { finePerDay }),
    ...(status !== undefined && { status }),
  };

  res.status(200).json({
    data: books[index],
  });
};

const deleteBook = (req, res) => {
  const { books } = req.app.locals.db;

  const index = books.findIndex((book) => book.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      error: "NOT_FOUND",
      message: "Book not found.",
      details: [],
    });
  }

  books.splice(index, 1);

  res.status(204).send();
};

export {
  getBooks,
  getBookById,
  createBook,
  // testRawBody,
  // testValidatedBody,
  // testBooksQuery,
  // testBookId,
  updateBook,
  deleteBook,
};
