export const ROLES = ['user', 'librarian', 'admin', 'super admin'] as const;
export type Role = (typeof ROLES)[number];

export const STAFF_ROLES: Role[] = ['librarian', 'admin', 'super admin'];
export const ADMIN_ROLES: Role[] = ['admin', 'super admin'];
