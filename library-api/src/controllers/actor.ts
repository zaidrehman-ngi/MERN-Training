import type { Request } from "express";
import { AuthenticationError } from "../errors/domainErrors.ts";
import type { Actor } from "../types/member.ts";

export const actorOf = (req: Request): Actor => {
  if (!req.user) {
    throw new AuthenticationError();
  }
  return { id: req.user.sub, role: req.user.role };
};
