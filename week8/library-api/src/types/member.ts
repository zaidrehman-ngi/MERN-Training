import type { Changes } from "./changes.ts";

export const ROLES = ["user", "librarian", "admin", "super admin"] as const;
export type Role = (typeof ROLES)[number];

export const STAFF_ROLES: Role[] = ["librarian", "admin", "super admin"];
export const ADMIN_ROLES: Role[] = ["admin", "super admin"];

export type Actor = { id: string; role: Role };

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
export type SessionUser = Pick<PublicMember, "id" | "name" | "email" | "role">;

export type SignUp = {
  name: string;
  email: string;
  password: string;
  branch: string;
};

export type MemberChanges = Changes<SignUp & { role: Role; joined: string }>;

export type NewMemberRow = Omit<SignUp, "password"> & {
  role: Role;
  joined: string;
  passwordHash: string;
};

export type MemberRowInput = Changes<NewMemberRow>;

export type MemberQuery = {
  q?: string | undefined;
  role?: Role | undefined;
  page: number;
  limit: number;
};
