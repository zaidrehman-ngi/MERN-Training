import { useState } from "react";
import { ALL_BOOKS } from "../data/books.fixture";

function KeyWarning() {
  const [books, setBooks] = useState(ALL_BOOKS);

  const handleRemove = (bookId) => {
    setBooks((currentBooks) =>
      currentBooks.filter((book) => book.id !== bookId),
    );
  };

  return (
    <div>
      <h2>Index Key Bug</h2>

      {books.map((book) => (
        <div key={book.id}>
          <input type="checkbox" />
          <span>{book.title}</span>
          <button onClick={() => handleRemove(book.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}

export default KeyWarning;
