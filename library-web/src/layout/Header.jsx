import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import socket from "../api/socket";
import { logout, selectUser } from "../store/authSlice";

export default function Header() {
  const [live, setLive] = useState(socket.connected ? "connected" : "offline");
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  useEffect(() => {
    const onConnect = () => setLive("connected");
    const onDisconnect = () => setLive("disconnected");
    const onError = (err) => {
      console.error("socket connect_error:", err.message);
      setLive(`error: ${err.message}`);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
    };
  }, []);

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
      <span data-testid="live-status">Live: {live}</span>
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
