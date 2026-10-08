function SearchBox({ searchText, onSearchChange }) {
  return (
    <div>
      <label htmlFor="search">Search by title or author</label>

      <input
        id="search"
        type="search"
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by title or author"
      />
    </div>
  );
}

export default SearchBox;
