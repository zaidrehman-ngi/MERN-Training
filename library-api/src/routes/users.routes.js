import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/users.controller.ts";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import { ROLES, STAFF_ROLES, ADMIN_ROLES } from "../types/member.ts";
import validate from "../middleware/validate.js";
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  userQuerySchema,
} from "../schemas/users.schema.ts";

const router = express.Router();

router.post("/", validate(createUserSchema, "body"), createUser);

router.get(
  "/",
  requireAuth,
  requireRole(...STAFF_ROLES),
  validate(userQuerySchema, "query"),
  getUsers,
);

router.get(
  "/:id",
  requireAuth,
  requireRole(...ROLES),
  validate(userIdSchema, "params"),
  getUserById,
);

router.patch(
  "/:id",
  requireAuth,
  requireRole(...ROLES),
  validate(userIdSchema, "params"),
  validate(updateUserSchema, "body"),
  updateUser,
);

router.delete(
  "/:id",
  requireAuth,
  requireRole(...ADMIN_ROLES),
  validate(userIdSchema, "params"),
  deleteUser,
);

export default router;
