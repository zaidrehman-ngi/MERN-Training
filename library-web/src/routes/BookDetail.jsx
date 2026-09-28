import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getBook } from "../api/books";
import { borrowBookThunk } from "../store/booksSlice";

function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [book, setBook] = useState(null);
  const [error, setError] = useState(null);
  const borrowStatus = useSelector(
    (state) => state.books.borrowStatusByBookId[id] ?? "idle",
  );
  const borrowError = useSelector(
    (state) => state.books.borrowErrorByBookId[id],
  );

  useEffect(() => {
    getBook(id)
      .then((response) => {
        setBook(response.data);
      })
      .catch((error) => {
        setError(error);
        setBook(null);
      });
  }, [id]);

  const handleBorrow = () => {
    const requestedAt = new Date();
    const dueDate = new Date(requestedAt);
    dueDate.setDate(dueDate.getDate() + 10);

    dispatch(
      borrowBookThunk({
        bookId: book.id,
        request: {
          bookId: book.id,
          userId: "m-1000",
          status: "pending",
          requestedAt: requestedAt.toISOString().slice(0, 10),
          dueDate: dueDate.toISOString().slice(0, 10),
          finePerDay: book.finePerDay ?? 20,
        },
      }),
    );
  };

  if (error) {
    return (
      <main>
        <h1>Book Not Found</h1>
        <p>{error.message || "This book is no longer available."}</p>

        <button onClick={() => navigate("/books")}>Back to catalogue</button>
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
      <button
        type="button"
        onClick={handleBorrow}
        disabled={
          borrowStatus === "pending" ||
          borrowStatus === "succeeded" ||
          Number(book.onShelf) < 1
        }
      >
        {borrowStatus === "pending"
          ? "Requesting..."
          : borrowStatus === "succeeded"
            ? "Request sent"
            : "Borrow"}
      </button>
      {borrowError && <p role="alert">{borrowError.message}</p>}
    </main>
  );
}

export default BookDetail;
