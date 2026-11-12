import { z } from "zod";
import { ROLES } from "../types/member.ts";
import { pageQuery } from "./common.ts";

const userRoleSchema = z.enum(ROLES);

const password = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .refine(
    (value) => Buffer.byteLength(value) <= 72,
    "Password must be at most 72 bytes.",
  );

const userQuerySchema = z.strictObject({
  q: z.string().trim().min(1).optional(),
  role: userRoleSchema.optional(),
  ...pageQuery,
});

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password,
  role: z.literal("user").default("user"),
  branch: z.string().min(1),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.email().optional(),
  role: userRoleSchema.optional(),
  branch: z.string().min(1).optional(),
  joined: z.string().min(1).optional(),
  password: password.optional(),
});

export { userQuerySchema, createUserSchema, updateUserSchema };

export type CreateUserBody = z.infer<typeof createUserSchema>;
export type UpdateUserBody = z.infer<typeof updateUserSchema>;
