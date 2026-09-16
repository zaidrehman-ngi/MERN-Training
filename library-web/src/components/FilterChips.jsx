function FilterChips({ onFilterChange }) {
  return (
    <div>
      <button onClick={() => onFilterChange("all")}>All</button>

      <button onClick={() => onFilterChange("available")}>Available</button>

      <button onClick={() => onFilterChange("out")}>Out</button>

      <button onClick={() => onFilterChange("overdue")}>Overdue</button>
    </div>
  );
}

export default FilterChips;
