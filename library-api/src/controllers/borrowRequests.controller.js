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
    return res.status(404).json({
      error: "NOT_FOUND",
      message: "Borrow request not found.",
      details: [],
    });
  }

  res.status(200).json(borrowRequest);
};

const createBorrowRequest = (req, res) => {
  const { borrowRequests } = req.app.locals.db;

  const { userId, bookId, status, requestedAt, dueDate, finePerDay } =
    req.body || {};

  const details = [];

  if (userId === undefined) {
    details.push({
      field: "userId",
      message: "User ID is required.",
    });
  }

  if (bookId === undefined) {
    details.push({
      field: "bookId",
      message: "Book ID is required.",
    });
  }

  if (status === undefined) {
    details.push({
      field: "status",
      message: "Status is required.",
    });
  }

  if (requestedAt === undefined) {
    details.push({
      field: "requestedAt",
      message: "Requested time is required.",
    });
  }

  if (dueDate === undefined) {
    details.push({
      field: "dueDate",
      message: "Due date is required.",
    });
  }

  if (finePerDay === undefined) {
    details.push({
      field: "finePerDay",
      message: "Fine per day is required.",
    });
  }

  if (details.length > 0) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Some fields are missing.",
      details,
    });
  }

  const allowedStatuses = ["pending", "approved", "rejected"];

  if (!allowedStatuses.includes(status)) {
    return res.status(422).json({
      error: "VALIDATION_ERROR",
      message: "Invalid borrow request status.",
      details: [
        {
          field: "status",
          message: "Status must be pending, approved, or rejected.",
        },
      ],
    });
  }

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
    return res.status(404).json({
      error: "NOT_FOUND",
      message: "Borrow request not found.",
      details: [],
    });
  }

  const { status, finePerDay } = req.body || {};

  if (status !== undefined) {
    const allowedStatuses = ["pending", "approved", "rejected"];

    if (!allowedStatuses.includes(status)) {
      return res.status(422).json({
        error: "VALIDATION_ERROR",
        message: "Invalid borrow request status.",
        details: [
          {
            field: "status",
            message: "Status must be pending, approved, or rejected.",
          },
        ],
      });
    }
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
    return res.status(404).json({
      error: "NOT_FOUND",
      message: "Borrow request not found.",
      details: [],
    });
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
