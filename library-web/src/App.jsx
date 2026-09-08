import BookList from "./components/BookList";
import books from "./data/books";

function App() {
  return (
    <div>
      <BookList books={books} />
    </div>
  );
}

export default App;
