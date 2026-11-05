import type { Role } from "./member.ts";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: { sub: string; role: Role; name: string };
      token?: { jti: string; exp: number };
    }
  }
}

export {};
