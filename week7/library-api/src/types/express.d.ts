import type { Role } from "./member.ts";

declare global {
  namespace Express {
    interface Request {
      user?: { sub: string; role: Role; name: string };
      token?: { jti: string; exp: number };
    }
  }
}

export {};
