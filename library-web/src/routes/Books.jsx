import { useState } from "react";
import { Link } from "react-router-dom";

function Books() {
  const [search, setSearch] = useState("");

  return (
    <main>
      <h1>Books</h1>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search books"
      />

      <p>Search: {search}</p>

      <Link to="/users">Go to Users</Link>
      <br />
      <a href="/users">Go to Users with Anchor</a>
    </main>
  );
}

export default Books;
