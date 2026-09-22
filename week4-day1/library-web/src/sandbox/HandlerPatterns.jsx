function HandlerPatterns() {
  const handleBorrow = (bookId) => {
    console.log("Borrowing book:", bookId);
  };

  const createBorrowHandler = (bookId) => {
    return () => {
      console.log("Borrowing book:", bookId);
    };
  };

  const handleDataBorrow = (e) => {
    const bookId = e.currentTarget.dataset.bookId;
    console.log("Borrowing book:", bookId);
  };

  return (
    <div>
      <h2>Handler Patterns</h2>

      <button onClick={() => handleBorrow("book-101")}>Borrow Dune</button>

      <button onClick={createBorrowHandler("book-202")}>Borrow 1984</button>

      <button data-book-id="book-303" onClick={handleDataBorrow}>
        Borrow Foundation
      </button>
    </div>
  );
}

export default HandlerPatterns;
