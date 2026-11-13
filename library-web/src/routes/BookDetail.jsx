import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getBook } from "../api/books";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useSocket } from "../hooks/useSocket";
import { SOCKET_EVENTS } from "../constants/socketEvents";
import {
  borrowBookThunk,
  deleteBookThunk,
  resetBookMutation,
} from "../store/booksSlice";

function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, can } = useCurrentUser();
  const { socket, status: liveStatus } = useSocket();

  const [bookState, setBookState] = useState(null);
  const [attempt, setAttempt] = useState(0);
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
          setBookState({ id, book: response.data.data, status: "succeeded" });
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
  }, [dispatch, id, attempt]);

  useEffect(() => {
    const watch = () => socket.emit(SOCKET_EVENTS.BOOK_WATCH, { bookId: id });
    // events sent while we were offline are gone, so load the book again
    const rejoin = () => {
      watch();
      getBook(id)
        .then((response) =>
          setBookState((current) =>
            current?.id === id
              ? { ...current, book: response.data.data }
              : current,
          ),
        )
        .catch(() => {});
    };
    const onAvailability = ({ bookId, available }) => {
      if (bookId !== id) return;
      setBookState((current) =>
        current?.id === id && current.book
          ? { ...current, book: { ...current.book, onShelf: available } }
          : current,
      );
    };

    if (socket.connected) watch();
    socket.on("connect", rejoin);
    socket.on(SOCKET_EVENTS.BOOK_AVAILABILITY_CHANGED, onAvailability);

    return () => {
      socket.off("connect", rejoin);
      socket.off(SOCKET_EVENTS.BOOK_AVAILABILITY_CHANGED, onAvailability);
      if (socket.connected) {
        socket.emit(SOCKET_EVENTS.BOOK_UNWATCH, { bookId: id });
      }
    };
  }, [socket, id]);

  const handleRetry = () => {
    setBookState(null);
    setAttempt((current) => current + 1);
  };

  const handleBorrow = () => {
    dispatch(
      borrowBookThunk({
        bookId: book.id,
        request: { bookId: book.id },
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

  if (error && (error.status === 404 || error.status === 400)) {
    return (
      <main>
        <h1>Book Not Found</h1>
        <p role="alert">This book is no longer available.</p>

        <button onClick={() => navigate("/books")}>Back to catalogue</button>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <h1>Could not load this book</h1>
        <p role="alert">{error.message}</p>

        <button onClick={handleRetry}>Retry</button>
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
        {user && ["reconnecting", "offline"].includes(liveStatus) && (
          <p role="status">
            {liveStatus === "reconnecting"
              ? "Live updates paused, reconnecting..."
              : "You are offline."}{" "}
            The copies shown may be out of date.
          </p>
        )}
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
          {can("requests:create") ? (
            <button
              type="button"
              onClick={handleBorrow}
              disabled={
                borrowStatus === "pending" || borrowStatus === "succeeded"
              }
            >
              {borrowStatus === "pending"
                ? "Requesting..."
                : borrowStatus === "succeeded"
                  ? "Request sent"
                  : Number(book.onShelf) < 1
                    ? "Join the queue"
                    : "Borrow"}
            </button>
          ) : (
            !user && (
              <Link to="/login" state={{ from: `/books/${book.id}` }}>
                Log in to borrow
              </Link>
            )
          )}
          {can("books:edit") && (
            <Link to={`/books/${book.id}/edit`}>Edit book</Link>
          )}
          {can("books:delete") && (
            <button
              className="dangerButton"
              type="button"
              onClick={handleDelete}
              disabled={
                deleteStatus === "loading" || deleteStatus === "succeeded"
              }
            >
              {deleteStatus === "loading" ? "Deleting..." : "Delete book"}
            </button>
          )}
        </div>
        {borrowError && <p role="alert">{borrowError.message}</p>}
        {deleteError && <p role="alert">{deleteError.message}</p>}
      </section>
    </main>
  );
}

export default BookDetail;
