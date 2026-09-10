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

import Catalogue from "./components/Catalogue";
import { books } from "./data/books";

function App() {
  return (
    <div>
      <Catalogue books={books} />
    </div>
  );
}

export default App;
