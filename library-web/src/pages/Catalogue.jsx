import { useEffect, useState } from "react";
import { loadBooks } from "../data/mockApi";
import BookCard from "../components/BookCard/BookCard";
import SearchBox from "../components/SearchBox";
import ResultCount from "../components/ResultCount";
import FilterChips from "../components/FilterChips";

function Catalogue() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");

    loadBooks({
      filter: selectedFilter,
      search: searchText,
    })
      .then((books) => {
        if (!ignore) {
          setBooks(books);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setError(error.message);
          setBooks([]);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedFilter, searchText]);

  return (
    <main>
      <h1>Catalogue</h1>

      {loading && <p>Loading books...</p>}

      {!loading && error && (
        <p>
          Something went wrong while loading the catalogue. Please try again.
        </p>
      )}

      {!loading && !error && (
        <>
          <FilterChips onFilterChange={setSelectedFilter} />

          <SearchBox searchText={searchText} onSearchChange={setSearchText} />

          {books.length === 0 ? (
            <p>No books found. Try changing your search or filter.</p>
          ) : (
            <>
              <ResultCount count={books.length} />

              <div>
                {books.map((book) => (
                  <div key={book.id}>
                    <input type="checkbox" />
                    <BookCard book={book} />
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}

export default Catalogue;
