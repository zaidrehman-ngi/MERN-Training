import { io } from "socket.io-client";

// Same server as the API, without the /api/v1 path.
const socketUrl = new URL(import.meta.env.VITE_API_URL).origin;

// The token is read again on every (re)connect, so a new login is picked up.
const socket = io(socketUrl, {
  autoConnect: false,
  withCredentials: true,
  auth: (send) => send({ token: sessionStorage.getItem("token") }),
});

export default socket;
