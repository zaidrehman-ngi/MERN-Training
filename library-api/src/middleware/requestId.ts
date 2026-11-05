import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

const requestId: RequestHandler = (req, res, next) => {
  req.requestId = randomUUID();
  res.set("X-Request-Id", req.requestId);
  next();
};

export default requestId;
