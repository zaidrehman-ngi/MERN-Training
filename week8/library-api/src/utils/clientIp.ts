import type { Request } from "express";
import { ipKeyGenerator } from "express-rate-limit";
import config from "../config/config.ts";

const clientIpKey = (req: Request) => {
  const fromHeader = config.clientIpHeader
    ? req.get(config.clientIpHeader)?.trim()
    : undefined;
  return ipKeyGenerator(fromHeader || req.ip || "");
};

export default clientIpKey;
