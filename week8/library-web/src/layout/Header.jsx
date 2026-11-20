import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import LiveStatus from "../components/LiveStatus/LiveStatus";
import { logout } from "../store/authSlice";
import { useCurrentUser } from "../hooks/useCurrentUser";

export default function Header() {
  const { user } = useCurrentUser();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  return (
    <header>
      <Link className="brand" to="/" aria-label="Karachi Central Library home">
        <span className="brandMark" aria-hidden="true">
          KC
        </span>
        <span className="brandText">
          <strong>Karachi Central Library</strong>
          <span>Library management</span>
        </span>
      </Link>
      <div className="headerActions">
        {user ? (
          <>
            <LiveStatus />
            <span className="headerUser">
              <strong>{user.name}</strong>
              <span>{user.role}</span>
            </span>
            <button
              type="button"
              className="headerButton headerButtonOutline"
              onClick={handleLogout}
            >
              Log out
            </button>
          </>
        ) : pathname === "/login" ? (
          <Link className="headerButton headerButtonOutline" to="/register">
            Register
          </Link>
        ) : (
          <Link className="headerButton" to="/login">
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}
