import type { Request, Response } from "express";
import { servicesFor } from "./services.ts";
import type { IdParams, RequestWithBody } from "../types/http.ts";
import type {
  CreateBookBody,
  UpdateBookBody,
} from "../schemas/books.schema.ts";

const getBooks = async (req: Request, res: Response) => {
  const books = await servicesFor(req).books.list(req.query);
  res.status(200).json({ data: books });
};

const getBookById = async (req: Request<IdParams>, res: Response) => {
  const book = await servicesFor(req).books.getById(req.params.id);
  res.status(200).json(book);
};

const createBook = async (
  req: RequestWithBody<CreateBookBody>,
  res: Response,
) => {
  const book = await servicesFor(req).books.create(req.body);
  res.status(201).location(`/api/v1/books/${book.id}`).json({ data: book });
};

const updateBook = async (
  req: RequestWithBody<UpdateBookBody, IdParams>,
  res: Response,
) => {
  const book = await servicesFor(req).books.update(req.params.id, req.body);
  res.status(200).json({ data: book });
};

const deleteBook = async (req: Request<IdParams>, res: Response) => {
  await servicesFor(req).books.delete(req.params.id);
  res.status(204).send();
};

export { getBooks, getBookById, createBook, updateBook, deleteBook };
