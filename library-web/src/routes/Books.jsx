import { useNavigate } from "react-router-dom";
import { useCallback, useEffect } from "react";
import BookCard from "../components/BookCard/BookCard";
import SearchBox from "../components/SearchBox";
import ResultCount from "../components/ResultCount";
import FilterChips from "../components/FilterChips";
import Pagination from "../components/Pagination";
import { useDispatch, useSelector } from "react-redux";
import useDebounce from "../hooks/useDebounce";
import {
  fetchBooks,
  filterChanged,
  pageChanged,
  selectAllBooks,
  selectBooksError,
  selectBooksStatus,
  selectFilter,
  selectPage,
  selectPageCount,
  selectSearch,
  selectTotal,
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
  const page = useSelector(selectPage);
  const pageCount = useSelector(selectPageCount);
  const total = useSelector(selectTotal);

  useEffect(() => {
    dispatch(fetchBooks({ filter, search: debouncedSearchText, page }));
  }, [dispatch, filter, debouncedSearchText, page]);

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
    dispatch(fetchBooks({ filter, search: debouncedSearchText, page }));
  };

  return (
    <main>
      <h1>Books</h1>
      <FilterChips
        activeFilter={filter}
        onFilterChange={handleFilterChange}
      />{" "}
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
          <ResultCount count={books.length} total={total} />{" "}
          <div>
            {" "}
            {books.map((book) => (
              <div key={book.id}>
                <BookCard book={book} onSelect={handleSelect} />{" "}
              </div>
            ))}{" "}
          </div>{" "}
          <Pagination
            page={page}
            pageCount={pageCount}
            onPageChange={(next) => dispatch(pageChanged(next))}
          />
        </>
      )}{" "}
    </main>
  );
}
export default Books;
