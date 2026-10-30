import type { Changes } from "./changes.ts";

export type Role = "user" | "librarian" | "admin";

export type PublicMember = {
  id: string;
  name: string;
  email: string | null;
  role: Role;
  branch: string;
  joined: string | null;
};

export type MemberRecord = PublicMember & {
  passwordHash: string | null;
};

export type AuthMember = Pick<PublicMember, "id" | "name" | "role">;

export type SignUp = {
  name: string;
  email: string;
  password: string;
  branch: string;
  joined: string;
};

export type MemberChanges = Changes<SignUp & { role: Role }>;

export type NewMemberRow = Omit<SignUp, "password"> & {
  role: Role;
  passwordHash: string;
};

export type MemberRowInput = Changes<NewMemberRow>;

export type MemberQuery = {
  page?: number;
  limit?: number;
};
