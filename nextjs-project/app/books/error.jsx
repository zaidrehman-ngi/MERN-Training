"use client";

export default function Error({ error, retry }) {
  return (
    <main>
      <h1>Books</h1>
      <p>{error?.message || "Failed to load books."}</p>
      <button onClick={() => retry()}>Retry</button>
    </main>
  );
}
