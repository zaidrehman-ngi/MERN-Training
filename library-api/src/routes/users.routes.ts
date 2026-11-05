import express from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/users.controller.ts";
import requireAuth from "../middleware/requireAuth.ts";
import requireRole from "../middleware/requireRole.ts";
import { STAFF_ROLES, ADMIN_ROLES } from "../types/member.ts";
import validate from "../middleware/validate.ts";
import { updateUserSchema, userQuerySchema } from "../schemas/users.schema.ts";
import { idParamsSchema } from "../schemas/common.ts";

const router = express.Router();

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
  validate(idParamsSchema, "params"),
  getUserById,
);

router.patch(
  "/:id",
  requireAuth,
  validate(idParamsSchema, "params"),
  validate(updateUserSchema, "body"),
  updateUser,
);

router.delete(
  "/:id",
  requireAuth,
  requireRole(...ADMIN_ROLES),
  validate(idParamsSchema, "params"),
  deleteUser,
);

export default router;
