import "./BookCard.css";

function BookCard({ book, onSelect, variant = "default" }) {
  const author = book.author ?? "Unknown author";
  const year = book.year ?? "Unknown year";
  const coverUrl = book.coverUrl ?? "/covers/placeholder.jpg";

  const status = ["available", "out", "overdue"].includes(book.status)
    ? book.status
    : "Status unavailable";

  return (
    <article className={`book-card book-card--${variant}`}>
      <img
        className="book-card__cover"
        src={coverUrl}
        alt={`${book.title ?? "Unknown title"} cover`}
      />

      <div className="book-card__content">
        <h3 className="book-card__title">{book.title ?? "Untitled book"}</h3>

        <p className="book-card__author">{author}</p>

        <p className="book-card__year">{year}</p>

        <p className="book-card__status">{status}</p>

        <button type="button" onClick={() => onSelect?.(book)}>
          View Book
        </button>
      </div>
    </article>
  );
}

export default BookCard;
