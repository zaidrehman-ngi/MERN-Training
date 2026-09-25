import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBook } from "../api/books";

function BookDetail() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getBook(id)
      .then((response) => {
        setBook(response.data);
      })
      .catch((error) => {
        setError(error.message);
        setBook(null);
      });
  }, [id]);

  if (error) {
    return (
      <main>
        <h1>Book Not Found</h1>
        <p>{error}</p>
      </main>
    );
  }

  if (!book) {
    return (
      <main>
        <p>Loading book...</p>
      </main>
    );
  }

  return (
    <main>
      <h1>{book.title}</h1>
      <p>Author: {book.author ?? "Unknown author"}</p>
      <p>Year: {book.year ?? "Unknown year"}</p>
      <p>ISBN: {book.isbn}</p>
      <p>
        Copies: {book.onShelf} / {book.totalCopies}
      </p>
      <p>Fine per day: Rs. {book.finePerDay}</p>
      <p>Status: {book.status}</p>
    </main>
  );
}

export default BookDetail;
