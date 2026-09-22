function BookCard({ book }) {
  const surname = book.author ? book.author.split(" ").pop() : "Unknown";
  const year = book.year ?? "Unknown year";
  const coverUrl = book.coverUrl ?? "/covers/placeholder.jpg";

  return (
    <div className="book-card" data-book-id={book.id}>
      <img src={coverUrl} alt={`${book.title} cover`} />

      <h3 className="book-card__title">{book.title}</h3>

      <p className="author">
        {book.author ?? "Unknown author"} &middot; {year}
      </p>

      <p>Author surname: {surname}</p>
      <p>Book Status: {book.status ?? "Unknown status"}</p>

      <span className="badge">
        {book.onShelf} of {book.totalCopies} on shelf
      </span>
    </div>
  );
}

export default BookCard;