import express from "express";
import { login, logout, refreshToken } from "../controllers/auth.controller.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.post("/login", login);

router.post(
  "/logout",
  requireAuth,
  requireRole("user", "librarian", "admin", "super admin"),
  logout,
);

router.post(
  "/refresh",
  requireAuth,
  requireRole("user", "librarian", "admin", "super admin"),
  refreshToken,
);

export default router;
