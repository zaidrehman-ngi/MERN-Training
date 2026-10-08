import React from "react";

const FilterChips = React.memo(function FilterChips({
  activeFilter = "all",
  onFilterChange,
}) {
  const filters = [
    { label: "All", value: "all" },
    { label: "Available", value: "available" },
    { label: "Out", value: "out" },
    { label: "Overdue", value: "overdue" },
  ];

  return (
    <div
      className="filterChips"
      role="group"
      aria-label="Filter books by availability"
    >
      {filters.map(({ label, value }) => (
        <button
          key={value}
          className={`filterChip${
            activeFilter === value ? " filterChipActive" : ""
          }`}
          type="button"
          aria-pressed={activeFilter === value}
          onClick={() => onFilterChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
});

export default FilterChips;
