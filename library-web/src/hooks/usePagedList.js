import { useEffect, useState } from "react";

export function usePagedList(load, params) {
  const [result, setResult] = useState({ items: [], total: 0, limit: 10 });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const key = JSON.stringify(params);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("loading");
    setError(null);

    load(JSON.parse(key))
      .then((response) => {
        if (!active) return;
        const { data, meta } = response.data;
        setResult({ items: data, total: meta.total, limit: meta.limit });
        setStatus("succeeded");
      })
      .catch((error) => {
        if (!active) return;
        setError(error);
        setResult({ items: [], total: 0, limit: 10 });
        setStatus("failed");
      });

    return () => {
      active = false;
    };
  }, [load, key]);

  const pageCount = Math.max(1, Math.ceil(result.total / result.limit));
  return { ...result, pageCount, status, error };
}
