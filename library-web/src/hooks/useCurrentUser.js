import { useSelector } from "react-redux";
import { selectAuthStatus, selectUser } from "../store/authSlice";
import { ADMIN_ROLES, STAFF_ROLES } from "../constants/roles";
import { can } from "../constants/permissions";

export function useCurrentUser() {
  const user = useSelector(selectUser);
  const status = useSelector(selectAuthStatus);
  const role = user?.role ?? null;

  return {
    user,
    role,
    status,
    isStaff: STAFF_ROLES.includes(role),
    isAdmin: ADMIN_ROLES.includes(role),
    hasRole: (roles) => roles.includes(role),
    can: (action) => can(role, action),
  };
}
