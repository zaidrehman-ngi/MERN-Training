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
        <p role="alert">
          {error.message || "This book is no longer available."}
        </p>

        <button onClick={() => navigate("/books")}>Back to catalogue</button>
      </main>
    );
  }

  if (loadStatus === "idle" || loadStatus === "loading") {
    return (
      <main>
        <p role="status">Loading book...</p>
      </main>
    );
  }

  return (
    <main>
      <section className="detailPanel">
        <h1>{book.title}</h1>
        <dl className="detailList">
          <div>
            <dt>Author</dt>
            <dd>{book.author ?? "Unknown author"}</dd>
          </div>
          <div>
            <dt>Year</dt>
            <dd>{book.year ?? "Unknown year"}</dd>
          </div>
          <div>
            <dt>ISBN</dt>
            <dd>{book.isbn}</dd>
          </div>
          <div>
            <dt>Copies</dt>
            <dd>
              {book.onShelf} / {book.totalCopies}
            </dd>
          </div>
          <div>
            <dt>Fine per day</dt>
            <dd>Rs. {book.finePerDay}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{book.status}</dd>
          </div>
        </dl>
        <div className="detailActions">
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
          <Link to={`/books/${book.id}/edit`}>Edit book</Link>
          <button
            className="dangerButton"
            type="button"
            onClick={handleDelete}
            disabled={deleteStatus === "loading" || deleteStatus === "succeeded"}
          >
            {deleteStatus === "loading" ? "Deleting..." : "Delete book"}
          </button>
        </div>
        {borrowError && <p role="alert">{borrowError.message}</p>}
        {deleteError && <p role="alert">{deleteError.message}</p>}
      </section>
    </main>
  );
}

export default BookDetail;
