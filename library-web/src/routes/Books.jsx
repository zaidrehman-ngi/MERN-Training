import { useSearchParams } from "react-router-dom";
import BookCard from "../components/BookCard/BookCard";
import SearchBox from "../components/SearchBox";
import ResultCount from "../components/ResultCount";
import FilterChips from "../components/FilterChips";
import { useBookSearch } from "../hooks/useBookSearch";

function Books() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedFilter = searchParams.get("filter") ?? "all";
  const searchText = searchParams.get("q") ?? "";

  const {
    results: books,
    loading,
    error,
  } = useBookSearch(searchText, selectedFilter);

  return (
    <main>
      <h1>Books</h1>

      {loading && <p>Loading books...</p>}

      {!loading && error && (
        <p>
          Something went wrong while loading the catalogue. Please try again.
        </p>
      )}

      {!loading && !error && (
        <>
          <FilterChips
            onFilterChange={(filter) =>
              setSearchParams({ filter, q: searchText })
            }
          />

          <SearchBox
            searchText={searchText}
            onSearchChange={(search) =>
              setSearchParams({ filter: selectedFilter, q: search })
            }
          />

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

export default Books;
