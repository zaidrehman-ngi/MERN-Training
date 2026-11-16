"use client";

import Link from "next/link";

export default function Error({ error, retry }) {
  return (
    <main>
      <h1>Could not load this book</h1>
      <p role="alert">{error?.message}</p>
      <button onClick={() => retry()}>Retry</button>
      <Link href="/books">Back to catalogue</Link>
    </main>
  );
}
