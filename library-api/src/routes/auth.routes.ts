import express from "express";
import {
  register,
  login,
  logout,
  refreshToken,
} from "../controllers/auth.controller.ts";
import requireAuth from "../middleware/requireAuth.ts";
import validate from "../middleware/validate.ts";
import loginRateLimiter from "../middleware/loginRateLimiter.ts";
import { loginSchema } from "../schemas/auth.schema.ts";
import { createUserSchema } from "../schemas/users.schema.ts";

const router = express.Router();

router.post("/register", validate(createUserSchema, "body"), register);

router.post("/login", loginRateLimiter, validate(loginSchema, "body"), login);

router.post("/logout", requireAuth, logout);

router.post("/refresh", refreshToken);

export default router;
