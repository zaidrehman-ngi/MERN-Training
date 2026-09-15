import FilterChips from "./FilterChips";

function PanelHeader({ title, branchName, bookCount, onFilterChange }) {
  return (
    <div className="panel__head">
      <div className="panel__head-left">
        <h2 className="panel__title">{title}</h2>

        <p className="panel__subtitle">
          {branchName} &middot; {bookCount} titles
        </p>
      </div>

      <div className="panel__head-right">
        <FilterChips onFilterChange={onFilterChange} />
      </div>
    </div>
  );
}

export default PanelHeader;
