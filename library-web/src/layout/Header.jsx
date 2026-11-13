import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import LiveStatus from "../components/LiveStatus/LiveStatus";
import { logout } from "../store/authSlice";
import { useCurrentUser } from "../hooks/useCurrentUser";

export default function Header() {
  const { user } = useCurrentUser();
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
      {user && <LiveStatus />}
      {user ? (
        <span>
          {user.name} ({user.role}){" "}
          <button type="button" onClick={handleLogout}>
            Log out
          </button>
        </span>
      ) : (
        <Link to="/login">Log in</Link>
      )}
    </header>
  );
}
