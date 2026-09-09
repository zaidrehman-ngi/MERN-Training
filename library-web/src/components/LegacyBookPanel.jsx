import PanelHeader from "./PanelHeader";
import BookList from "./BookList";
import PanelFooter from "./PanelFooter";

function LegacyBookPanel({
  title,
  branchName,
  books,
  totalCount,
  onFilterChange,
  onBorrow,
}) {
  return (
    <div className="panel">
      <PanelHeader
        title={title}
        branchName={branchName}
        bookCount={books.length}
        onFilterChange={onFilterChange}
      />

      <BookList books={books} />

      <PanelFooter
        bookCount={books.length}
        totalCount={totalCount}
        branchName={branchName}
        onBorrow={onBorrow}
      />
    </div>
  );
}

export default LegacyBookPanel;
