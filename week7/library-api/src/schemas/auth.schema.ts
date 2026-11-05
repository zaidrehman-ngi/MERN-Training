import { z } from "zod";

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export { loginSchema };

export type LoginBody = z.infer<typeof loginSchema>;
