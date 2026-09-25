import { useEffect, useState } from "react";
import { listBorrowRequests } from "../api/borrowRequests";

export function useBorrowRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");

    listBorrowRequests()
      .then((response) => {
        setRequests(response.data);
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
