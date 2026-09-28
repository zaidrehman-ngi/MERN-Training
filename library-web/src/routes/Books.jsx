import { useNavigate } from "react-router-dom";
import { useCallback, useEffect } from "react";
import BookCard from "../components/BookCard/BookCard";
import SearchBox from "../components/SearchBox";
import ResultCount from "../components/ResultCount";
import FilterChips from "../components/FilterChips";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedBranch } from "../store/uiSlice";
import {
  fetchBooks,
  bookAdded,
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
  const filter = useSelector(selectFilter);
  const status = useSelector(selectBooksStatus);
  const error = useSelector(selectBooksError);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const selectedBranch = useSelector((state) => state.ui.selectedBranch);
  const books = useSelector(selectAllBooks);
  const hasTestBook = books.some((book) => book.id === 101);

  useEffect(() => {
    dispatch(fetchBooks({ filter, search: searchText }));
  }, [dispatch, filter, searchText]);
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
    dispatch(fetchBooks({ filter, search: searchText }));
  };
  return (
    <main>
      {" "}
      <h1>Books</h1> <p>Selected branch: {selectedBranch}</p>{" "}
      <button onClick={() => dispatch(setSelectedBranch("Gulshan Branch"))}>
        {" "}
        Select Gulshan Branch{" "}
      </button>{" "}
      <button onClick={() => dispatch(setSelectedBranch("Clifton Branch"))}>
        {" "}
        Select Clifton Branch{" "}
      </button>{" "}
      <button
        onClick={() => dispatch(setSelectedBranch("North Nazimabad Branch"))}
      >
        {" "}
        Select North Nazimabad Branch{" "}
      </button>{" "}
      <button
        disabled={hasTestBook}
        onClick={() =>
          dispatch(bookAdded({ id: 101, title: "Test Book", onShelf: 1 }))
        }
      >
        {" "}
        Add Test Book{" "}
      </button>{" "}
      <FilterChips onFilterChange={handleFilterChange} />{" "}
      <SearchBox
        searchText={searchText}
        onSearchChange={(search) => dispatch(searchChanged(search))}
      />{" "}
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
                {" "}
                <input type="checkbox" />{" "}
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
