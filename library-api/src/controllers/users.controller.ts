import type { Request, Response } from "express";
import { servicesFor } from "./services.ts";
import type { IdParams, RequestWithBody } from "../types/http.ts";
import type {
  CreateUserBody,
  UpdateUserBody,
} from "../schemas/users.schema.ts";

const getUsers = async (req: Request, res: Response) => {
  const users = await servicesFor(req).users.list(req.query);
  res.status(200).json({
    data: users,
  });
};

const getUserById = async (req: Request<IdParams>, res: Response) => {
  const user = await servicesFor(req).users.getById(req.params.id);
  res.status(200).json(user);
};

// Same response whether the email was new or already registered.
const registrationResponse = {
  message:
    "Registration received. If this email wasn't already registered, the account has been created and you can log in.",
};

const createUser = async (
  req: RequestWithBody<CreateUserBody>,
  res: Response,
) => {
  await servicesFor(req).users.create(req.body);
  res.status(201).json(registrationResponse);
};

const updateUser = async (
  req: RequestWithBody<UpdateUserBody, IdParams>,
  res: Response,
) => {
  const updatedUser = await servicesFor(req).users.update(
    req.params.id,
    req.body,
  );
  res.status(200).json({
    data: updatedUser,
  });
};

const deleteUser = async (req: Request<IdParams>, res: Response) => {
  await servicesFor(req).users.delete(req.params.id);
  res.status(204).send();
};

export {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  registrationResponse,
};
