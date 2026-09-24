import { useNavigate } from "react-router-dom";
import { useCallback, useEffect } from "react";
// import { ALL_BOOKS } from "../data/books.fixture.js";
import { generateBooks } from "../data/generateBooks";
import BookCardModule from "../components/BookCard/BookCardModule";
import SearchBox from "../components/SearchBox";
import ResultCount from "../components/ResultCount";
import FilterChips from "../components/FilterChips";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedBranch } from "../store/uiSlice";
import {
  booksLoaded,
  bookAdded,
  filterChanged,
  selectAllBooks,
  selectSearch,
  searchChanged,
  selectFilteredBooks,
} from "../store/booksSlice";

function Books() {
  const searchText = useSelector(selectSearch);
  const navigate = useNavigate();

  const selectedBranch = useSelector((state) => state.ui.selectedBranch);
  const books = useSelector(selectAllBooks);
  const filteredBooks = useSelector(selectFilteredBooks);

  const dispatch = useDispatch();

  // useEffect(() => {
  //   if (books.length === 0) {
  //     dispatch(booksLoaded(ALL_BOOKS));
  //   }
  // }, [books.length, dispatch]);

  useEffect(() => {
    dispatch(booksLoaded(generateBooks(2000)));
  }, [dispatch]);

  const handleSelect = useCallback(
    (selectedBook) => {
      navigate(`/books/${selectedBook.id}`);
    },
    [navigate],
  );

  const handleFilterChange = useCallback(
    (filter) => dispatch(filterChanged(filter)),
    [dispatch],
  );

  return (
    <main>
      <h1>Books</h1>

      <p>Selected branch: {selectedBranch}</p>

      <button onClick={() => dispatch(setSelectedBranch("Gulshan Branch"))}>
        Select Gulshan Branch
      </button>

      <button onClick={() => dispatch(setSelectedBranch("Clifton Branch"))}>
        Select Clifton Branch
      </button>

      <button
        onClick={() => dispatch(setSelectedBranch("North Nazimabad Branch"))}
      >
        Select North Nazimabad Branch
      </button>

      <button
        onClick={() =>
          dispatch(
            bookAdded({
              id: 101,
              title: "Test Book",
              onShelf: 1,
            }),
          )
        }
      >
        Add Test Book
      </button>

      <FilterChips
        onFilterChange={handleFilterChange}
      />

      <SearchBox
        searchText={searchText}
        onSearchChange={(search) => dispatch(searchChanged(search))}
      />

      {filteredBooks.length === 0 ? (
        <p>No books found. Try changing your search or filter.</p>
      ) : (
        <>
          <ResultCount count={filteredBooks.length} />

          <div>
            {filteredBooks.map((book) => (
              <div key={book.id}>
                <input type="checkbox" />
                <BookCardModule book={book} onSelect={handleSelect} />
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

export default Books;
