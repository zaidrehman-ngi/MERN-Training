const getBorrowRequests = async (req, res) => {
  const result = await req.app.locals.services.borrowRequests.list(req.query);
  res.status(200).json({
    data: result,
  });
};

const getBorrowRequestById = async (req, res) => {
  const borrowRequest = await req.app.locals.services.borrowRequests.getById(
    req.params.id,
  );
  res.status(200).json(borrowRequest);
};

const createBorrowRequest = async (req, res) => {
  const newBorrowRequest = await req.app.locals.services.borrowRequests.create(
    req.body,
  );
  res.status(201).json({
    data: newBorrowRequest,
  });
};

const updateBorrowRequest = async (req, res) => {
  const borrowRequest = await req.app.locals.services.borrowRequests.update(
    req.params.id,
    req.body,
  );
  res.status(200).json({
    data: borrowRequest,
  });
};

const returnBorrowedBook = async (req, res) => {
  const borrowRequest = await req.app.locals.services.borrowRequests.returnBook(
    req.params.id,
  );

  res.status(200).json({
    message: "Book returned successfully.",
    borrowRequestId: borrowRequest.id,
    status: borrowRequest.status,
  });
};

export {
  getBorrowRequests,
  getBorrowRequestById,
  createBorrowRequest,
  updateBorrowRequest,
  returnBorrowedBook,
};
