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

const router = express.Router();

router.post("/", createUser);
router.get("/", requireAuth, requireRole("librarian", "admin"), getUsers);
router.get("/:id", requireAuth, requireRole("user", "librarian", "admin"), getUserById);
router.patch("/:id", requireAuth, requireRole("admin"), updateUser);
router.delete("/:id", requireAuth, requireRole("admin"), deleteUser);

export default router;
