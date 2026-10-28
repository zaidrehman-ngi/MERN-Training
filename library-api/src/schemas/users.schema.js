import { z } from "zod";

const userIdSchema = z.object({
  id: z.string().min(1),
});

const userRoleSchema = z.enum(["user", "librarian", "admin"]);

const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().default(10),
});

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
  email: z.string().email().optional(),
  role: userRoleSchema.optional(),
  branch: z.string().min(1).optional(),
  joined: z.string().min(1).optional(),
  password: z.string().min(8).optional(),
});

export { userIdSchema, userQuerySchema, createUserSchema, updateUserSchema };
