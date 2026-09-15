// ==================== Exercise 1 Task 1 ====================

// import Counter from "./sandbox/Counter";
// import HoverCard from "./sandbox/HoverCard";
// import Toggle from "./sandbox/Toggle";

// function App() {
//   return (
//     <div>
//       <h1>Event Sandbox</h1>

//       <Toggle />
//       <Counter />
//       <HoverCard />
//     </div>
//   );
// }

// export default App;

// ==================== Exercise 1 Task 2 ====================

// function App() {
//   const handleClick = (event) => {
//     console.log("React event:", event);
//     console.log("Native event:", event.nativeEvent);
//   };

//   return (
//     <div>
//       <button onClick={handleClick}>Click Me</button>
//     </div>
//   );
// }

// export default App;

// ==================== Exercise 1 Task 3 ====================

// function App() {
//   const handleClick = (e) => {
//     console.log("target:", e.target);
//     console.log("currentTarget:", e.currentTarget);
//     console.log("same:", e.target === e.currentTarget);
//   };

//   return (
//     <div onClick={handleClick}>
//       <button>Click Me</button>
//     </div>
//   );
// }

// export default App;

// ==================== Exercise 1 Task 4 ====================

// function App() {
//   const handleRowClick = () => {
//     console.log("opening detail page");
//   };

//   const handleBorrow = (e) => {
//     e.stopPropagation();
//     console.log("borrowing book");
//   };

//   return (
//     <div onClick={handleRowClick}>
//       <h2>Dune</h2>

//       <button onClick={handleBorrow}>Borrow</button>
//     </div>
//   );
// }

// export default App;

// ==================== Exercise 1 Task 5 ====================

// import HandlerPatterns from "./sandbox/HandlerPatterns";

// function App() {
//   return (
//     <div>
//       <HandlerPatterns />
//     </div>
//   );
// }

// export default App;

// ==================== Exercise 1 Task 6 ====================

// import KeyboardAccessibleRow from "./sandbox/KeyboardAccessibleRow";

// function App() {
//   return (
//     <div>
//       <KeyboardAccessibleRow />
//     </div>
//   );
// }

// export default App;

// ==================== Exercise 2 Task 1 ====================

// import ConditionalBadge from "./sandbox/ConditionalBadge";

// function App() {
//   return (
//     <div>
//       <ConditionalBadge />
//     </div>
//   );
// }

// export default App;

// ==================== Exercise 2 Task 3 ====================

// import CatalogueBody from "./sandbox/CatalogueBody";

// function App() {
//   return (
//     <div>
//       <CatalogueBody />
//     </div>
//   );
// }

// export default App;

// ==================== Exercise 2 Task 4 ====================

// import ConditionalAttributes from "./sandbox/ConditionalAttributes";

// function App() {
//   return (
//     <div>
//       <ConditionalAttributes />
//     </div>
//   );
// }

// export default App;

// ==================== Exercise 2 Task 5 ====================

// import HideToggle from "./sandbox/HideToggle";

// function App() {
//   return (
//     <div>
//       <HideToggle />
//     </div>
//   );
// }

// export default App;

// ==================== Exercise 3 Task 1 ====================

import KeyWarning from "./sandbox/KeyWarning";

function App() {
  return (
    <div>
      <KeyWarning />
    </div>
  );
}

export default App;