import type { Request } from "express";
import type createServices from "../services/createServices.js";

export type Services = ReturnType<typeof createServices>;

// Express types app.locals as Record<string, any>. This is the only place
// it's read, so the any stops here instead of reaching every controller.
export const servicesFor = (req: Request): Services => req.app.locals.services;
