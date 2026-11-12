import type { Request, Response } from "express";
import { pageBody } from "./page.ts";
import type { MemberQuery } from "../types/member.ts";
import { servicesFor } from "./services.ts";
import { actorOf } from "./actor.ts";
import type { IdParams, RequestWithBody } from "../types/http.ts";
import type { UpdateUserBody } from "../schemas/users.schema.ts";

const getUsers = async (req: Request, res: Response) => {
  const users = await servicesFor(req).users.list(
    req.query as unknown as MemberQuery,
  );
  res.status(200).json(pageBody(users));
};

const getUserById = async (req: Request<IdParams>, res: Response) => {
  const user = await servicesFor(req).users.getVisible(
    req.params.id,
    actorOf(req),
  );
  res.status(200).json({ data: user });
};

const updateUser = async (
  req: RequestWithBody<UpdateUserBody, IdParams>,
  res: Response,
) => {
  const updatedUser = await servicesFor(req).users.update(
    req.params.id,
    req.body,
    actorOf(req),
  );
  res.status(200).json({
    data: updatedUser,
  });
};

const deleteUser = async (req: Request<IdParams>, res: Response) => {
  await servicesFor(req).users.delete(req.params.id, actorOf(req));
  res.status(204).send();
};

export { getUsers, getUserById, updateUser, deleteUser };
