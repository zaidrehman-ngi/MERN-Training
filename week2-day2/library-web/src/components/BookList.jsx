import BookRow from "./BookRow";

function BookList({ books }) {
  return (
    <div className="panel__body">
      {books.map((book) => (
        <BookRow key={book.id} book={book} />
      ))}
    </div>
  );
}

export default BookList;
