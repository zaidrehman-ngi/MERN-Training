import { useEffect, useState } from "react";
import { loadBooks } from "../data/mockApi";
import useDebounce from "./useDebounce";

export function useBookSearch(search, filter) {
  const debouncedSearch = useDebounce(search, 500);

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");

    loadBooks({
      filter,
      search: debouncedSearch,
    })
      .then((books) => {
        if (!ignore) {
          setResults(books);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setError(error.message);
          setResults([]);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [filter, debouncedSearch]);

  return {
    results,
    loading,
    error,
  };
}
