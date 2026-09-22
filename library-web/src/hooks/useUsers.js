import { useEffect, useState } from "react";
import { loadUsers } from "../data/mockApi";

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");

    loadUsers()
      .then((users) => {
        setUsers(users);
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
