import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/users.controller.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import validate from "../middleware/validate.js";
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
} from "../schemas/users.schema.js";

const router = express.Router();

router.post("/", validate(createUserSchema, "body"), createUser);

router.get("/", requireAuth, requireRole("librarian", "admin"), getUsers);

router.get(
  "/:id",
  requireAuth,
  requireRole("user", "librarian", "admin"),
  validate(userIdSchema, "params"),
  getUserById,
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("admin"),
  validate(userIdSchema, "params"),
  validate(updateUserSchema, "body"),
  updateUser,
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  validate(userIdSchema, "params"),
  deleteUser,
);

export default router;
