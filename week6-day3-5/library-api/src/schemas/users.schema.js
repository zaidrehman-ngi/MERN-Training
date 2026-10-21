import { z } from "zod";

const userIdSchema = z.object({
  id: z.string().min(1),
});

const userRoleSchema = z.enum(["user", "librarian", "admin"]);

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.literal("user").default("user"),
  branch: z.string().min(1),
  joined: z.string().min(1),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().min(1).optional(),
  role: userRoleSchema.optional(),
  branch: z.string().min(1).optional(),
  joined: z.string().min(1).optional(),
  password: z.string().min(8).optional(),
});

export { userIdSchema, createUserSchema, updateUserSchema };
