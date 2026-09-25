import { useEffect, useState } from "react";
import { listUsers } from "../api/users";

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");

    listUsers()
      .then((response) => {
        setUsers(response.data);
      })
      .catch((error) => {
        setError(error.message);
        setUsers([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { users, loading, error };
}
