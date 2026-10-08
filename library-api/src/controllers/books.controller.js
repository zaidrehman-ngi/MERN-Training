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
