import CataloguePanel from "../components/CataloguePanel";
import { books } from "../data/books";

function Main() {
  return (
    <main>
      <CataloguePanel
        title="Catalogue"
        books={books}
        totalCount={1284}
        onFilterChange={(filter) => console.log("filter:", filter)}
        onBorrow={(id) => console.log("borrow:", id)}
      />
    </main>
  );
}

export default Main;
