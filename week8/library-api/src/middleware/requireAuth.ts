import type { RequestHandler } from "express";
import { servicesFor } from "../controllers/services.ts";

// the role comes from the database, so a deleted or demoted member's old token stops working
const requireAuth: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : undefined;

  const { member, jti, exp } =
    await servicesFor(req).auth.verifyAccessToken(token);

  req.user = { sub: member.id, role: member.role, name: member.name };
  req.token = { jti, exp };
  next();
};

export default requireAuth;
