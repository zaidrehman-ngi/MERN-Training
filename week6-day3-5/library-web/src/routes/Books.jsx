import { useNavigate } from "react-router-dom";
import { useCallback, useEffect } from "react";
import BookCard from "../components/BookCard/BookCard";
import SearchBox from "../components/SearchBox";
import ResultCount from "../components/ResultCount";
import FilterChips from "../components/FilterChips";
import { useDispatch, useSelector } from "react-redux";
import useDebounce from "../hooks/useDebounce";
import {
  fetchBooks,
  filterChanged,
  selectAllBooks,
  selectBooksError,
  selectBooksStatus,
  selectFilter,
  selectSearch,
  searchChanged,
} from "../store/booksSlice";

function Books() {
  const searchText = useSelector(selectSearch);
  const debouncedSearchText = useDebounce(searchText, 300);
  const filter = useSelector(selectFilter);
  const status = useSelector(selectBooksStatus);
  const error = useSelector(selectBooksError);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const books = useSelector(selectAllBooks);

  useEffect(() => {
    dispatch(fetchBooks({ filter, search: debouncedSearchText }));
  }, [dispatch, filter, debouncedSearchText]);
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
  const handleRetry = () => {
    dispatch(fetchBooks({ filter, search: debouncedSearchText }));
  };
  return (
    <main>
      <h1>Books</h1>
      <FilterChips activeFilter={filter} onFilterChange={handleFilterChange} />{" "}
      <SearchBox
        searchText={searchText}
        onSearchChange={(search) => dispatch(searchChanged(search))}
      />{" "}
      {status === "idle" && <p role="status">Waiting to load books...</p>}{" "}
      {status === "loading" && (
        <p role="status">
          {books.length > 0 ? "Updating books..." : "Loading books..."}
        </p>
      )}{" "}
      {status === "failed" && (
        <div>
          {" "}
          <p>{error?.message || "Failed to load books."}</p>{" "}
          {error?.action && <p>{error.action}</p>}{" "}
          <button onClick={handleRetry}>Retry</button>{" "}
        </div>
      )}{" "}
      {status === "succeeded" && books.length === 0 && (
        <p>No books found. Try changing your search or filter.</p>
      )}{" "}
      {status !== "idle" && books.length > 0 && (
        <>
          {" "}
          <ResultCount count={books.length} />{" "}
          <div>
            {" "}
            {books.map((book) => (
              <div key={book.id}>
                <BookCard book={book} onSelect={handleSelect} />{" "}
              </div>
            ))}{" "}
          </div>{" "}
        </>
      )}{" "}
    </main>
  );
}
export default Books;
