function BookCard({ book }) {
  return (
    <div className="book-card" data-book-id={book.id}>
      <img src={book.coverUrl} alt={`${book.title} cover`} />

      <h3 className="book-card__title">{book.title}</h3>

      <p className="author">
        {book.author} &middot; {book.year}
      </p>

      <span className="badge">
        {book.onShelf} of {book.totalCopies} on shelf
      </span>
    </div>
  );
}

export default BookCard;
