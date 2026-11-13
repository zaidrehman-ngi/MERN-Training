import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import NotFound from "../routes/NotFound";

function RequireAuth({ roles }) {
  const { user, status, hasRole, can } = useCurrentUser();
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
    // a member has no staff pages, so for them these pages don't exist
    if (!can("requests:seeAll")) {
      return <NotFound />;
    }
    // staff know the page exists, so say who it is for
    return (
      <main>
        <h1>Not allowed</h1>
        <p>
          This page is only for {roles.join(" and ")} accounts. If you need
          something changed here, ask one of them.
        </p>
        <Link to="/">Return to home</Link>
      </main>
    );
  }

  return <Outlet />;
}

export default RequireAuth;
