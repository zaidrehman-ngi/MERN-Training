import express from "express";
import {
  register,
  login,
  logout,
  refreshToken,
} from "../controllers/auth.controller.ts";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import { ROLES } from "../types/member.ts";
import validate from "../middleware/validate.js";
import loginRateLimiter from "../middleware/loginRateLimiter.js";
import { loginSchema } from "../schemas/auth.schema.ts";
import { createUserSchema } from "../schemas/users.schema.ts";

const router = express.Router();

router.post("/register", validate(createUserSchema, "body"), register);

router.post("/login", loginRateLimiter, validate(loginSchema, "body"), login);

router.post(
  "/logout",
  requireAuth,
  requireRole(...ROLES),
  logout,
);

router.post("/refresh", refreshToken);

export default router;
