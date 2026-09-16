import { useState } from "react";
import { ALL_BOOKS } from "../data/books.fixture";
import BookCard from "../components/BookCard/BookCard";
import SearchBox from "../components/SearchBox";
import ResultCount from "../components/ResultCount";
import FilterChips from "../components/FilterChips";

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
          <FilterChips onFilterChange={setSelectedFilter} />

          <SearchBox searchText={searchText} onSearchChange={setSearchText} />

          <ResultCount count={filteredBooks.length} />

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
