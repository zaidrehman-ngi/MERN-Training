import type { Request } from "express";

export type IdParams = { id: string };

export type RequestWithBody<Body, Params = Record<string, string>> = Request<
  Params,
  unknown,
  Body
>;
