import type { Request } from "express";
import type { Services } from "../services/createServices.ts";

// app.locals is typed as any, so it is read only here
export const servicesFor = (req: Request): Services => req.app.locals.services;
