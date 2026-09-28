import { useEffect, useState } from "react";
import { listBorrowRequests } from "../api/borrowRequests";

export function useBorrowRequests() {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("loading");
    setError("");

    listBorrowRequests()
      .then((response) => {
        setRequests(response.data);
        setStatus("succeeded");
      })
      .catch((error) => {
        setError(error);
        setRequests([]);
        setStatus("failed");
      });
  }, []);

  return { requests, status, error };
}
