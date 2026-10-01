const getBooks = (req, res) => {
  const { books } = req.app.locals.db;

  let result = [...books];

  const {
    author,
    title,
    available,
    sort,
    order = "asc",
    page = "1",
    limit = "10",
  } = req.query;

  // Filters
  if (author) {
    result = result.filter((book) => book.author === author);
  }

  if (title) {
    result = result.filter((book) => book.title === title);
  }

  if (available !== undefined) {
    if (available !== "true" && available !== "false") {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "The available parameter must be true or false.",
        details: [
          {
            field: "available",
            message: "Expected true or false.",
          },
        ],
      });
    }

    result = result.filter((book) =>
      available === "true" ? book.onShelf > 0 : book.onShelf === 0,
    );
  }

  // Sorting
  if (sort) {
    const allowedSortFields = ["title", "author", "year"];

    if (!allowedSortFields.includes(sort)) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Invalid sort field.",
        details: [
          {
            field: "sort",
            message: "Allowed fields are title, author, and year.",
          },
        ],
      });
    }

    if (order !== "asc" && order !== "desc") {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Invalid sort order.",
        details: [
          {
            field: "order",
            message: "Order must be asc or desc.",
          },
        ],
      });
    }

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
  const pageNumber = Number(page);
  const limitNumber = Number(limit);

  if (
    !Number.isInteger(pageNumber) ||
    pageNumber < 1 ||
    !Number.isInteger(limitNumber) ||
    limitNumber < 1
  ) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Invalid pagination parameters.",
      details: [
        {
          field: "page",
          message: "Page must be a positive integer.",
        },
        {
          field: "limit",
          message: "Limit must be a positive integer.",
        },
      ],
    });
  }

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

  const details = [];

  if (!title) {
    details.push({
      field: "title",
      message: "Title is required.",
    });
  }

  if (!author) {
    details.push({
      field: "author",
      message: "Author is required.",
    });
  }

  if (!isbn) {
    details.push({
      field: "isbn",
      message: "ISBN is required.",
    });
  }

  if (year === undefined) {
    details.push({
      field: "year",
      message: "Year is required.",
    });
  }

  if (onShelf === undefined) {
    details.push({
      field: "onShelf",
      message: "On-shelf copies are required.",
    });
  }

  if (totalCopies === undefined) {
    details.push({
      field: "totalCopies",
      message: "Total copies are required.",
    });
  }

  if (finePerDay === undefined) {
    details.push({
      field: "finePerDay",
      message: "Fine per day is required.",
    });
  }

  if (!status) {
    details.push({
      field: "status",
      message: "Status is required.",
    });
  }

  if (details.length > 0) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Some fields are missing.",
      details,
    });
  }

  if (
    !Number.isInteger(year) ||
    year < 0 ||
    !Number.isInteger(onShelf) ||
    onShelf < 0 ||
    !Number.isInteger(totalCopies) ||
    totalCopies < 0 ||
    !Number.isInteger(finePerDay) ||
    finePerDay < 0
  ) {
    return res.status(422).json({
      error: "VALIDATION_ERROR",
      message: "Some fields have invalid values.",
      details: [
        ...(!Number.isInteger(year) || year < 0
          ? [
              {
                field: "year",
                message: "Year must be a valid non-negative integer.",
              },
            ]
          : []),
        ...(!Number.isInteger(onShelf) || onShelf < 0
          ? [
              {
                field: "onShelf",
                message: "On-shelf copies must be a non-negative integer.",
              },
            ]
          : []),
        ...(!Number.isInteger(totalCopies) || totalCopies < 0
          ? [
              {
                field: "totalCopies",
                message: "Total copies must be a non-negative integer.",
              },
            ]
          : []),
        ...(!Number.isInteger(finePerDay) || finePerDay < 0
          ? [
              {
                field: "finePerDay",
                message: "Fine per day must be a non-negative integer.",
              },
            ]
          : []),
      ],
    });
  }

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

  if (year !== undefined && (!Number.isInteger(year) || year < 0)) {
    return res.status(422).json({
      error: "VALIDATION_ERROR",
      message: "Some fields have invalid values.",
      details: [
        {
          field: "year",
          message: "Year must be a valid non-negative integer.",
        },
      ],
    });
  }

  if (onShelf !== undefined && (!Number.isInteger(onShelf) || onShelf < 0)) {
    return res.status(422).json({
      error: "VALIDATION_ERROR",
      message: "Some fields have invalid values.",
      details: [
        {
          field: "onShelf",
          message: "On-shelf copies must be a non-negative integer.",
        },
      ],
    });
  }

  if (
    totalCopies !== undefined &&
    (!Number.isInteger(totalCopies) || totalCopies < 0)
  ) {
    return res.status(422).json({
      error: "VALIDATION_ERROR",
      message: "Some fields have invalid values.",
      details: [
        {
          field: "totalCopies",
          message: "Total copies must be a non-negative integer.",
        },
      ],
    });
  }

  if (
    finePerDay !== undefined &&
    (!Number.isInteger(finePerDay) || finePerDay < 0)
  ) {
    return res.status(422).json({
      error: "VALIDATION_ERROR",
      message: "Some fields have invalid values.",
      details: [
        {
          field: "finePerDay",
          message: "Fine per day must be a non-negative integer.",
        },
      ],
    });
  }

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

export { getBooks, getBookById, createBook, updateBook, deleteBook };
