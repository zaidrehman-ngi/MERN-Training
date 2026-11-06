import type { RequestHandler } from "express";
import { forbidden } from "../errors/ApiError.ts";
import { AuthenticationError } from "../errors/domainErrors.ts";
import type { Role } from "../types/member.ts";

const requireRole =
  (...allowedRoles: Role[]): RequestHandler =>
  (req, res, next) => {
    if (!req.user) {
      next(new AuthenticationError());
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(forbidden("You do not have permission to perform this action."));
      return;
    }
    next();
  };

export default requireRole;
