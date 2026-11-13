import { useContext } from "react";
import { SocketContext } from "../context/socketContext";

export function useSocket() {
  const value = useContext(SocketContext);
  if (!value) {
    throw new Error("useSocket must be used inside SocketProvider.");
  }
  return value;
}
