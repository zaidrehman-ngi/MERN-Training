import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { ROLES, type Role } from './roles.js';

@Injectable()
export class DemoUserMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const role = req.header('x-role');
    if (ROLES.includes(role as Role)) {
      req.user = { role: role as Role };
    }
    next();
  }
}
