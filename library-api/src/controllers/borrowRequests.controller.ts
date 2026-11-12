import type { Request, Response } from "express";
import { servicesFor } from "./services.ts";
import type { IdParams, RequestWithBody } from "../types/http.ts";
import type {
  CreateBorrowRequestBody,
  UpdateBorrowRequestBody,
} from "../schemas/borrowRequests.schema.ts";
import { actorOf } from "./actor.ts";
import { pageBody } from "./page.ts";
import type { BorrowRequestQuery } from "../types/borrowRequest.ts";

const getBorrowRequests = async (req: Request, res: Response) => {
  const result = await servicesFor(req).borrowRequests.list(
    req.query as unknown as BorrowRequestQuery,
    actorOf(req),
  );
  res.status(200).json(pageBody(result));
};

const getOverdueBorrowRequests = async (req: Request, res: Response) => {
  const overdue = await servicesFor(req).borrowRequests.listOverdue();
  res.status(200).json({ data: overdue });
};

const getBorrowRequestById = async (req: Request<IdParams>, res: Response) => {
  const borrowRequest = await servicesFor(req).borrowRequests.getVisible(
    req.params.id,
    actorOf(req),
  );
  res.status(200).json({ data: borrowRequest });
};

const createBorrowRequest = async (
  req: RequestWithBody<CreateBorrowRequestBody>,
  res: Response,
) => {
  const newBorrowRequest = await servicesFor(req).borrowRequests.create(
    actorOf(req).id,
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
    actorOf(req),
  );
  res.status(200).json({
    data: borrowRequest,
  });
};

const cancelBorrowRequest = async (req: Request<IdParams>, res: Response) => {
  const borrowRequest = await servicesFor(req).borrowRequests.cancel(
    req.params.id,
    actorOf(req).id,
  );
  res.status(200).json({ data: borrowRequest });
};

const getQueuePosition = async (req: Request<IdParams>, res: Response) => {
  const position = await servicesFor(req).borrowRequests.queuePosition(
    req.params.id,
    actorOf(req),
  );
  res.status(200).json({ data: position });
};

const returnBorrowedBook = async (req: Request<IdParams>, res: Response) => {
  const borrowRequest = await servicesFor(req).borrowRequests.returnBook(
    req.params.id,
  );

  res.status(200).json({ data: borrowRequest });
};

export {
  getBorrowRequests,
  getOverdueBorrowRequests,
  getBorrowRequestById,
  createBorrowRequest,
  updateBorrowRequest,
  cancelBorrowRequest,
  getQueuePosition,
  returnBorrowedBook,
};
