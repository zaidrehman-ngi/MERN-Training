import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getBook } from "../api/books";
import {
  borrowBookThunk,
  deleteBookThunk,
  resetBookMutation,
} from "../store/booksSlice";

function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [bookState, setBookState] = useState(null);
  const book = bookState?.id === id ? bookState.book : null;
  const error = bookState?.id === id ? bookState.error : null;
  const loadStatus = bookState?.id === id ? bookState.status : "loading";
  const borrowStatus = useSelector(
    (state) => state.books.borrowStatusByBookId[id] ?? "idle",
  );
  const borrowError = useSelector(
    (state) => state.books.borrowErrorByBookId[id],
  );
  const deleteStatus = useSelector(
    (state) => state.books.deleteStatusById[id] ?? "idle",
  );
  const deleteError = useSelector((state) => state.books.deleteErrorById[id]);

  useEffect(() => {
    let active = true;
    dispatch(resetBookMutation({ operation: "delete", id }));

    getBook(id)
      .then((response) => {
        if (active) {
          setBookState({ id, book: response.data, status: "succeeded" });
        }
      })
      .catch((error) => {
        if (active) {
          setBookState({ id, error, status: "failed" });
        }
      });

    return () => {
      active = false;
    };
  }, [dispatch, id]);

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

  const handleDelete = () => {
    dispatch(deleteBookThunk(id)).then((result) => {
      if (deleteBookThunk.fulfilled.match(result)) {
        navigate("/books");
      }
    });
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

  if (loadStatus === "idle" || loadStatus === "loading") {
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
      <Link to={`/books/${book.id}/edit`}>Edit book</Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleteStatus === "loading" || deleteStatus === "succeeded"}
      >
        {deleteStatus === "loading" ? "Deleting..." : "Delete book"}
      </button>
      {deleteError && <p role="alert">{deleteError.message}</p>}
    </main>
  );
}

export default BookDetail;
