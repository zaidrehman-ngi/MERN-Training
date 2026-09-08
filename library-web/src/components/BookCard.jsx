function borrow(id) {
  console.log("borrow requested for", id);
}

function BookCard({ book }) {
  return (
    <div className="book-card" data-book-id={book.id}>
      <img src="/covers/dune.jpg" alt={`${book.title} cover`} />

      <h3 className="book-card__title">{book.title}</h3>

      <p className="author">
        {book.author} &middot; {book.year}
      </p>

      <span
        className="badge"
        style={{ backgroundColor: "#1a7f4b", padding: "2px 6px" }}
      >
        {book.onShelf} of {book.totalCopies} on shelf
      </span>

      <label htmlFor={`qty-${book.id}`}>Copies to borrow</label>
      <input id={`qty-${book.id}`} type="number" maxLength="2" />

      <button className="btn" onClick={() => borrow(book.id)}>
        Borrow
      </button>
    </div>
  );
}

export default BookCard;
