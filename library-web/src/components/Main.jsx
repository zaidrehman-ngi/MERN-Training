import LegacyBookPanel from "./LegacyBookPanel";
import { books } from "../data/books";

function Main({ branchName }) {
  return (
    <main>
      <LegacyBookPanel
        title="Catalogue"
        branchName={branchName}
        books={books}
        totalCount={1284}
        onFilterChange={(filter) => console.log("filter:", filter)}
        onBorrow={(id) => console.log("borrow:", id)}
      />
    </main>
  );
}

export default Main;
