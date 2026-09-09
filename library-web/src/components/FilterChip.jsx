function FilterChip({ label, filter, onFilterChange }) {
  return (
    <button className="chip" onClick={() => onFilterChange(filter)}>
      {label}
    </button>
  );
}

export default FilterChip;
