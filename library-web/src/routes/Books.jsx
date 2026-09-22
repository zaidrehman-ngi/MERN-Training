import { useSearchParams, useNavigate } from "react-router-dom";
// import BookCardStyled from "../components/BookCard/BookCardStyled";
// import BookCard from "../components/BookCard/BookCard";
// import BookCardInline from "../components/BookCard/BookCardInline";
import BookCardModule from "../components/BookCard/BookCardModule";
import SearchBox from "../components/SearchBox";
import ResultCount from "../components/ResultCount";
import FilterChips from "../components/FilterChips";
import { useBookSearch } from "../hooks/useBookSearch";

function Books() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedFilter = searchParams.get("filter") ?? "all";
  const searchText = searchParams.get("q") ?? "";
  const navigate = useNavigate();

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
                    {/* <BookCard book={book} /> */}
                    {/* <BookCardInline book={book} /> */}
                    <BookCardModule
                      book={book}
                      onSelect={(selectedBook) =>
                        navigate(`/books/${selectedBook.id}`)
                      }
                    />
                    {/* <BookCardStyled book={book} /> */}
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
