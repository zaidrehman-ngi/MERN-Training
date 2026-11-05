import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import socket from "../api/socket";

export default function Header() {
  const [live, setLive] = useState("connecting...");

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
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
      socket.disconnect();
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
    </header>
  );
}
