import { useState } from "react";
import { ALL_BOOKS } from "../data/books.fixture";
import BookCard from "../components/BookCard/BookCard";

function Catalogue() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [catalogueState, setCatalogueState] = useState("results");

  const filteredBooks = ALL_BOOKS.filter((book) => {
    const matchesFilter =
      selectedFilter === "all" || book.status === selectedFilter;

    const search = searchText.toLowerCase();

    const matchesSearch =
      book.title?.toLowerCase().includes(search) ||
      book.author?.toLowerCase().includes(search);

    return matchesFilter && matchesSearch;
  });

  return (
    <main>
      <h1>Catalogue</h1>

      <div>
        <button onClick={() => setCatalogueState("loading")}>Loading</button>

        <button onClick={() => setCatalogueState("error")}>Error</button>

        <button onClick={() => setCatalogueState("results")}>Loaded</button>
      </div>

      {catalogueState === "loading" && <p>Loading books...</p>}

      {catalogueState === "error" && (
        <p>
          Something went wrong while loading the catalogue. Please try again.
        </p>
      )}

      {catalogueState === "results" && (
        <>
          <div>
            <button onClick={() => setSelectedFilter("all")}>All</button>

            <button onClick={() => setSelectedFilter("available")}>
              Available
            </button>

            <button onClick={() => setSelectedFilter("out")}>Out</button>

            <button onClick={() => setSelectedFilter("overdue")}>
              Overdue
            </button>
          </div>

          <input
            type="search"
            placeholder="Search by title or author"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          {filteredBooks.length === 0 ? (
            <p>No books found. Try changing your search or filter.</p>
          ) : (
            <div>
              {filteredBooks.map((book) => (
                <div key={book.id}>
                  <input type="checkbox" />
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default Catalogue;
