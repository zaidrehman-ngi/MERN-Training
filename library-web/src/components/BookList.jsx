import BookCard from "./BookCard";

function BookList({ books }) {
  return (
    <>
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </>
  );
}

export default BookList;
