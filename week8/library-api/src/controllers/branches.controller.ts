import type { Request, Response } from "express";
import { servicesFor } from "./services.ts";

const getBranches = async (req: Request, res: Response) => {
  const branches = await servicesFor(req).branches.list();
  res.status(200).json({ data: branches });
};

export { getBranches };
