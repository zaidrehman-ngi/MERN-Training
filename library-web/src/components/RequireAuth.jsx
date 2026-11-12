import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";

function RequireAuth({ roles }) {
  const { user, status, hasRole } = useCurrentUser();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname + location.search,
          expired: status === "expired",
        }}
      />
    );
  }

  if (roles && !hasRole(roles)) {
    return (
      <main>
        <h1>Not allowed</h1>
        <p>Your account does not have access to this page.</p>
      </main>
    );
  }

  return <Outlet />;
}

export default RequireAuth;
