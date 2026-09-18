import { useState } from "react";
import { useBookSearch } from "../hooks/useBookSearch";

function BookSearchTest() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const rows = useBookSearch(search, filter, true);

  return (
    <main>
      <h1>Book Search Test</h1>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search books"
      />

      <button onClick={() => setFilter("available")}>Available</button>
      <button onClick={() => setFilter("all")}>All</button>

      <table>
        <tbody>{rows}</tbody>
      </table>
    </main>
  );
}

export default BookSearchTest;
