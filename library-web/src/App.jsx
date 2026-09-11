// import { useState } from "react";
// import PropStateBug from "./components/PropStateBug";

// function App() {
//   const [onShelf, setOnShelf] = useState(1);

//   return (
//     <div>
//       <PropStateBug onShelf={onShelf} />

//       <button onClick={() => setOnShelf(2)}>Return book</button>
//     </div>
//   );
// }

// export default App;

// import PropMutationBug from "./components/PropMutationBug";

// function App() {
//   const book = {
//     id: "bk-3",
//     title: "Hyperion",
//     onShelf: 1,
//   };

//   return (
//     <div>
//       <p>Parent before child: {book.onShelf} on shelf</p>

//       <PropMutationBug book={book} />

//       <p>Parent after child: {book.onShelf} on shelf</p>

//       {console.log("Parent book after child:", book)}
//     </div>
//   );
// }

// export default App;

// import Catalogue from "./components/Catalogue";
// import { MESSY_BOOKS } from "./data/books.fixture";

// function App() {
//   return (
//     <div>
//       <Catalogue books={MESSY_BOOKS} />
//     </div>
//   );
// }

// export default App;

// ==================== Exercise 2 Task 2 Test Cases ====================

// import BookCard from "./components/BookCard";

// function App() {
//   return (
//     <div>
//       {/* Test 1 — Omit required book prop */}
//       <BookCard />

//       {/* Test 2 — Pass string where number is expected */}
//       <BookCard
//         book={{
//           id: "test-1",
//           title: "Test Book",
//           author: "Test Author",
//           year: "2000",
//           onShelf: 1,
//           totalCopies: 1,
//           finePerDay: 20,
//           status: "available",
//         }}
//       />

//       {/* Test 3 — Pass invalid status */}
//       <BookCard
//         book={{
//           id: "test-2",
//           title: "Test Book",
//           author: "Test Author",
//           year: 2000,
//           onShelf: 1,
//           totalCopies: 1,
//           finePerDay: 20,
//           status: "RESERVED_STACK",
//         }}
//       />
//     </div>
//   );
// }

// export default App;

// import { useState } from "react";
// import LifecycleProbe from "./components/LifecycleProbe";

// function App() {
//   const [count, setCount] = useState(1);

//   return (
//     <div>
//       <LifecycleProbe count={count} />

//       <button onClick={() => setCount(count + 1)}>
//         Change Prop
//       </button>
//     </div>
//   );
// }

// export default App;

// import { useState } from "react";
// import LifecycleProbe from "./components/LifecycleProbe";

// function App() {
//   const [showProbe, setShowProbe] = useState(true);

//   return (
//     <div>
//       {showProbe && <LifecycleProbe />}

//       <button onClick={() => setShowProbe(false)}>Remove Probe</button>
//     </div>
//   );
// }

// export default App;

// import LifecycleProbe from "./components/LifecycleProbe";

// function App() {
//   return (
//     <div>
//       <LifecycleProbe>
//         <LifecycleProbe />
//         <LifecycleProbe />
//         <LifecycleProbe />
//       </LifecycleProbe>
//     </div>
//   );
// }

// export default App;

// import { useState } from "react";
// import LifecycleProbe from "./components/LifecycleProbe";

// function App() {
//   const [showProbe, setShowProbe] = useState(true);

//   return (
//     <div>
//       {showProbe && (
//         <LifecycleProbe>
//           <LifecycleProbe />
//           <LifecycleProbe />
//           <LifecycleProbe />
//         </LifecycleProbe>
//       )}

//       <button onClick={() => setShowProbe(false)}>Remove Probe</button>
//     </div>
//   );
// }

// export default App;

// ==================== Exercise 4 Task 3 ====================

import { ALL_BOOKS } from "./data/books.fixture";
import BookCard from "./components/BookCard/BookCard";

function App() {
  const handleSelect = (book) => {
    console.log("Selected book:", book);
  };

  return (
    <div>
      <h1>Library Catalogue</h1>

      {ALL_BOOKS.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onSelect={handleSelect}
          variant="default"
        />
      ))}
    </div>
  );
}

export default App;

// ==================== Exercise 4 Task 4 ====================

// import Gallery from "./components/BookCard/Gallery";

// function App() {
//   return (
//     <div>
//       <Gallery />
//     </div>
//   );
// }

// export default App;
