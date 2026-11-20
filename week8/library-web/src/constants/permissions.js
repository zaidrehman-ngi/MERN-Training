import { ADMIN_ROLES, ROLES, STAFF_ROLES } from "./roles";

const PERMISSIONS = {
  "books:add": STAFF_ROLES,
  "books:edit": STAFF_ROLES,
  "books:delete": ADMIN_ROLES,
  "requests:create": ROLES,
  "requests:seeAll": STAFF_ROLES,
  "requests:decide": STAFF_ROLES,
  "requests:return": STAFF_ROLES,
  "requests:changeDueDate": STAFF_ROLES,
  "fines:waive": ADMIN_ROLES,
  "members:list": STAFF_ROLES,
  "members:manage": ADMIN_ROLES,
  "admins:manage": ["super admin"],
  "jobs:run": ADMIN_ROLES,
};

export const can = (role, action) =>
  Boolean(role) && PERMISSIONS[action].includes(role);

// an admin hands out user and librarian, only a super admin hands out admin
export const assignableRoles = (role) => {
  if (role === "super admin") return ROLES;
  if (role === "admin") return ["user", "librarian"];
  return [];
};

// nobody manages themselves, and only a super admin manages an admin
export const canManageMember = (actor, member) =>
  actor.id !== member.id &&
  can(actor.role, "members:manage") &&
  (actor.role === "super admin" || !ADMIN_ROLES.includes(member.role));
