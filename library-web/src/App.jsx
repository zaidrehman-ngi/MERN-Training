// import Header from "./components/Header";
// import Sidebar from "./components/Sidebar";
// import Main from "./components/Main";
// import Footer from "./components/Footer";

// function App() {
//   const branchName = "Clifton Branch";

//   return (
//     <div>
//       <Header />
//       <Sidebar />
//       <Main branchName={branchName} />
//       <Footer />
//     </div>
//   );
// }

// export default App;

// import BookCard from "./components/BookCard";
// import BookCardClass from "./components/BookCardClass";

// function App() {
//   const book = {
//     id: "bk-4471",
//     author: "Frank Herbert",
//     year: 1965,
//   };

//   function handleBorrow(id) {
//     console.log("Book clicked:", id);
//   }

//   return (
//     <div>
//       <BookCard title="Dune" copies={3} book={book} onBorrow={handleBorrow} />
//       <BookCardClass
//         title="Dune"
//         copies={3}
//         book={book}
//         onBorrow={handleBorrow}
//       />
//     </div>
//   );
// }

// export default App;

import LegacyBookPanel from "./legacy/LegacyBookPanel";
import books from "./data/books";

function App() {
  return (
    <LegacyBookPanel
      title="Catalogue"
      branchName="Clifton Branch"
      books={books}
      totalCount={1284}
      onFilterChange={(filter) => console.log("filter:", filter)}
      onBorrow={(id) => console.log("borrow:", id)}
    />
  );
}

export default App;
