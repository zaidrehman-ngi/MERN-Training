import type { Request, Response } from "express";
import { servicesFor } from "./services.ts";
import type { IdParams, RequestWithBody } from "../types/http.ts";
import type {
  CreateBorrowRequestBody,
  UpdateBorrowRequestBody,
} from "../schemas/borrowRequests.schema.ts";
import { AuthenticationError } from "../errors/domainErrors.js";

const getBorrowRequests = async (req: Request, res: Response) => {
  const result = await servicesFor(req).borrowRequests.list(req.query);
  res.status(200).json({
    data: result,
  });
};

const getBorrowRequestById = async (req: Request<IdParams>, res: Response) => {
  const borrowRequest = await servicesFor(req).borrowRequests.getById(
    req.params.id,
  );
  res.status(200).json(borrowRequest);
};

const createBorrowRequest = async (
  req: RequestWithBody<CreateBorrowRequestBody>,
  res: Response,
) => {
  if (!req.user) {
    throw new AuthenticationError();
  }
  const newBorrowRequest = await servicesFor(req).borrowRequests.create(
    req.user.sub,
    req.body.bookId,
  );

  res
    .status(201)
    .location(`/api/v1/borrow-requests/${newBorrowRequest.id}`)
    .json({
      data: newBorrowRequest,
    });
};

const updateBorrowRequest = async (
  req: RequestWithBody<UpdateBorrowRequestBody, IdParams>,
  res: Response,
) => {
  const borrowRequest = await servicesFor(req).borrowRequests.update(
    req.params.id,
    req.body,
  );
  res.status(200).json({
    data: borrowRequest,
  });
};

const approveBorrowRequest = async (req: Request<IdParams>, res: Response) => {
  const borrowRequest = await servicesFor(req).borrowRequests.update(
    req.params.id,
    { status: "approved" },
  );

  res.status(200).json({
    message: "Borrow request approved",
    borrowRequestId: borrowRequest.id,
    status: borrowRequest.status,
  });
};

const returnBorrowedBook = async (req: Request<IdParams>, res: Response) => {
  const borrowRequest = await servicesFor(req).borrowRequests.returnBook(
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
  approveBorrowRequest,
  returnBorrowedBook,
};
