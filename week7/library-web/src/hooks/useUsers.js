import { useEffect, useState } from "react";
import { listUsers } from "../api/users";

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("loading");
    setError("");

    listUsers()
      .then((response) => {
        setUsers(response.data.data);
        setStatus("succeeded");
      })
      .catch((error) => {
        setError(error);
        setUsers([]);
        setStatus("failed");
      });
  }, []);

  return { users, status, error };
}
