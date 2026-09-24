import { useEffect, useState } from "react";
import { loadBorrowRequests } from "../data/mockApi";

export function useBorrowRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");

    loadBorrowRequests()
      .then((requests) => {
        setRequests(requests);
      })
      .catch((error) => {
        setError(error.message);
        setRequests([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { requests, loading, error };
}
