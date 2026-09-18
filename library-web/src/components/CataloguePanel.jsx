import PanelHeader from "./PanelHeader";
import BookList from "./BookList";
import PanelFooter from "./PanelFooter";

function CataloguePanel({
  title,
  books,
  totalCount,
  onFilterChange,
  onBorrow,
}) {
  return (
    <div className="panel">
      <PanelHeader
        title={title}
        bookCount={books.length}
        onFilterChange={onFilterChange}
      />

      <BookList books={books} />

      <PanelFooter
        bookCount={books.length}
        totalCount={totalCount}
        onBorrow={onBorrow}
      />
    </div>
  );
}

export default CataloguePanel;
