function BookCard({ title, copies, book, onBorrow }) {
  return (
    <div className="book-card" data-book-id={book.id}>
      <img src="/covers/dune.jpg" alt={`${title} cover`} />

      <h3 className="book-card__title">{title}</h3>

      <p className="author">
        {book.author} &middot; {book.year}
      </p>

      <span
        className="badge"
        style={{ backgroundColor: "#1a7f4b", padding: "2px 6px" }}
      >
        {copies} copies
      </span>

      <button className="btn" onClick={() => onBorrow(book.id)}>
        Borrow
      </button>
    </div>
  );
}

export default BookCard;
