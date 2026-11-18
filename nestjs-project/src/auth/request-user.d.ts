import type { Role } from './roles.js';

declare global {
  namespace Express {
    interface Request {
      user?: { role: Role };
    }
  }
}
