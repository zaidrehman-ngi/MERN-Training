import { notFound } from "../errors/ApiError.js";

const getBorrowRequests = (req, res) => {
  const { borrowRequests } = req.app.locals.db;

  let result = [...borrowRequests];

  const { userId, bookId, status } = req.query;

  if (userId) {
    result = result.filter((request) => request.userId === userId);
  }

  if (bookId) {
    result = result.filter((request) => request.bookId === bookId);
  }

  if (status) {
    result = result.filter((request) => request.status === status);
  }

  res.status(200).json({
    data: result,
  });
};

const getBorrowRequestById = (req, res) => {
  const { borrowRequests } = req.app.locals.db;

  const borrowRequest = borrowRequests.find(
    (request) => request.id === req.params.id,
  );

  if (!borrowRequest) {
    throw notFound("Borrow request not found.");
  }

  res.status(200).json(borrowRequest);
};

const createBorrowRequest = (req, res) => {
  const { borrowRequests } = req.app.locals.db;

  const { userId, bookId, status, requestedAt, dueDate, finePerDay } = req.body;

  const newBorrowRequest = {
    id: `br-${borrowRequests.length + 100}`,
    bookId,
    userId,
    status,
    requestedAt,
    dueDate,
    finePerDay,
  };

  borrowRequests.push(newBorrowRequest);

  res.status(201).json({
    data: newBorrowRequest,
  });
};

const updateBorrowRequest = (req, res) => {
  const { borrowRequests } = req.app.locals.db;

  const index = borrowRequests.findIndex(
    (request) => request.id === req.params.id,
  );

  if (index === -1) {
    throw notFound("Borrow request not found.");
  }

  borrowRequests[index] = {
    ...borrowRequests[index],
    ...req.body,
    id: borrowRequests[index].id,
  };

  res.status(200).json({
    data: borrowRequests[index],
  });
};

const returnBorrowedBook = (req, res) => {
  const { borrowRequests } = req.app.locals.db;

  const index = borrowRequests.findIndex(
    (request) => request.id === req.params.id,
  );

  if (index === -1) {
    throw notFound("Borrow request not found.");
  }

  borrowRequests[index].status = "returned";

  res.status(200).json({
    message: "Book returned successfully.",
    borrowRequestId: borrowRequests[index].id,
    status: "returned",
  });
};

export {
  getBorrowRequests,
  getBorrowRequestById,
  createBorrowRequest,
  updateBorrowRequest,
  returnBorrowedBook,
};
