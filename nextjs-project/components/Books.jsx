"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import BookCard from "./BookCard/BookCard";
import SearchBox from "./SearchBox";
import ResultCount from "./ResultCount";
import FilterChips from "./FilterChips";
import Pagination from "./Pagination";
import useDebounce from "../hooks/useDebounce";

function Books({ books, total, filter, search, page, pageCount }) {
  const [searchText, setSearchText] = useState(search);
  const debouncedSearchText = useDebounce(searchText, 300);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const goTo = useCallback(
    (changes) => {
      const params = new URLSearchParams();
      const next = { filter, search, page, ...changes };

      if (next.filter !== "all") params.set("status", next.filter);
      if (next.search.trim()) params.set("q", next.search.trim());
      if (next.page > 1) params.set("page", String(next.page));

      startTransition(() => router.push(`/books?${params}`));
    },
    [filter, search, page, router],
  );

  useEffect(() => {
    if (debouncedSearchText !== search) {
      goTo({ search: debouncedSearchText, page: 1 });
    }
  }, [debouncedSearchText, search, goTo]);

  const handleSelect = useCallback(
    (selectedBook) => {
      router.push(`/books/${selectedBook.id}`);
    },
    [router],
  );

  const handleFilterChange = useCallback(
    (filter) => goTo({ filter, page: 1 }),
    [goTo],
  );

  return (
    <main>
      <h1>Books</h1>
      <FilterChips
        activeFilter={filter}
        onFilterChange={handleFilterChange}
      />{" "}
      <SearchBox searchText={searchText} onSearchChange={setSearchText} />{" "}
      {isPending && <p role="status">Updating books...</p>}{" "}
      {books.length === 0 && (
        <p>No books found. Try changing your search or filter.</p>
      )}{" "}
      {books.length > 0 && (
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
            onPageChange={(next) => goTo({ page: next })}
          />
        </>
      )}{" "}
    </main>
  );
}

export default Books;
