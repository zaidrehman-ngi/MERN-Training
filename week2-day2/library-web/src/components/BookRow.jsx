import BookCover from "./BookCover";
import BookInfo from "./BookInfo";
import BookStatus from "./BookStatus";

function BookRow({ book }) {
  return (
    <div className="row">
      <BookCover coverUrl={book.coverUrl} title={book.title} />

      <BookInfo
        title={book.title}
        author={book.author}
        year={book.year}
        isbn={book.isbn}
      />

      <BookStatus
        onShelf={book.onShelf}
        totalCopies={book.totalCopies}
        finePerDay={book.finePerDay}
      />
    </div>
  );
}

export default BookRow;
