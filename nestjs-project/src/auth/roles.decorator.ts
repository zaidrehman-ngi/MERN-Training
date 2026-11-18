import { Reflector } from '@nestjs/core';
import type { Role } from './roles.js';

export const Roles = Reflector.createDecorator<Role[]>();
