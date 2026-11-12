import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { selectAuthStatus, selectUser } from "../store/authSlice";

function RequireAuth({ roles }) {
  const user = useSelector(selectUser);
  const status = useSelector(selectAuthStatus);
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

  if (roles && !roles.includes(user.role)) {
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
