import { useParams } from "react-router-dom";
import { ALL_BOOKS } from "../data/books.fixture";

function BookDetail() {
  const { id } = useParams();

  const book = ALL_BOOKS.find((book) => book.id === id);

  if (!book) {
    return (
      <main>
        <h1>Book Not Found</h1>
        <p>The requested book could not be found.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>{book.title}</h1>
      <p>Author: {book.author}</p>
      <p>Year: {book.year}</p>
      <p>ISBN: {book.isbn}</p>
    </main>
  );
}

export default BookDetail;
