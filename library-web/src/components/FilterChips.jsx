import FilterChip from "./FilterChip";

const filters = [
  { label: "All", filter: "all" },
  { label: "Available", filter: "available" },
  { label: "Overdue", filter: "overdue" },
];

function FilterChips({ onFilterChange }) {
  return (
    <>
      {filters.map((item) => (
        <FilterChip
          key={item.filter}
          label={item.label}
          filter={item.filter}
          onFilterChange={onFilterChange}
        />
      ))}
    </>
  );
}

export default FilterChips;
