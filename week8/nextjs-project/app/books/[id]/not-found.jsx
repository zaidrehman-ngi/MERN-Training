import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <h1>Book Not Found</h1>
      <p role="alert">This book is no longer available.</p>
      <Link href="/books">Back to catalogue</Link>
    </main>
  );
}
