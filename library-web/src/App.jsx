import BookCard from "./components/BookCard";
import books from "./data/books";

const copies = 3;

function handleBorrow(id) {
  console.log("Book clicked:", id);
}

function App() {
  const dune = books[0];

  return (
    <div>
      <BookCard
        title="Dune"
        copies={copies}
        book={dune}
        onBorrow={handleBorrow}
      />
    </div>
  );
}

export default App;
