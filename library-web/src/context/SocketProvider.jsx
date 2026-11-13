import { useEffect, useState } from "react";
import socket from "../api/socket";
import { refreshSession } from "../api/client";
import { endSession, setAccessToken } from "../api/session";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { SocketContext } from "./socketContext";

// one connection for the whole app, open while someone is logged in
export function SocketProvider({ children }) {
  const { user } = useCurrentUser();
  const userId = user?.id;
  const [status, setStatus] = useState("offline");

  useEffect(() => {
    let refreshing = false;
    let retryTimer = null;

    // the token ran out: get a new one and connect again, once
    const reconnectWithNewToken = async () => {
      if (refreshing) return;
      refreshing = true;
      setStatus("reconnecting");
      try {
        const response = await refreshSession();
        setAccessToken(response.data.data.accessToken);
        socket.connect();
      } catch (error) {
        refreshing = false;
        // only a refused refresh ends the session; a network error is tried again
        if (error.status === 401) {
          endSession();
        } else {
          retryTimer = setTimeout(reconnectWithNewToken, 5000);
        }
      }
    };

    const onConnect = () => {
      refreshing = false;
      clearTimeout(retryTimer);
      setStatus("connected");
    };
    const onDisconnect = (reason) => {
      if (reason === "io client disconnect") {
        setStatus("offline");
      } else if (reason === "io server disconnect") {
        // the server only drops us like this when the token is no longer good
        reconnectWithNewToken();
      } else {
        setStatus(navigator.onLine ? "reconnecting" : "offline");
      }
    };
    const onError = (err) => {
      if (err.data?.code === "UNAUTHORIZED") {
        reconnectWithNewToken();
      } else {
        setStatus(navigator.onLine ? "reconnecting" : "offline");
      }
    };
    // no network at all: say so instead of "reconnecting"
    const onBrowserOffline = () => setStatus("offline");
    const onBrowserOnline = () => {
      if (socket.active && !socket.connected) setStatus("reconnecting");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);
    window.addEventListener("offline", onBrowserOffline);
    window.addEventListener("online", onBrowserOnline);
    return () => {
      clearTimeout(retryTimer);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
      window.removeEventListener("offline", onBrowserOffline);
      window.removeEventListener("online", onBrowserOnline);
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("connecting");
    socket.connect();
    return () => {
      socket.disconnect();
      setStatus("offline");
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket, status }}>
      {children}
    </SocketContext.Provider>
  );
}
