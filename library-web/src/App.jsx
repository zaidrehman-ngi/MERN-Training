// Exercise 1 - Task 2

// import { useState } from "react";

// function App() {
//   const [count, setCount] = useState(0);

//   const handleClick = () => {
//     setCount((currentCount) => currentCount + 1);
//     setCount((currentCount) => currentCount + 1);
//     setCount((currentCount) => currentCount + 1);

//     console.log("count:", count);
//   };

//   return (
//     <div>
//       <p>Count: {count}</p>
//       <button onClick={handleClick}>Add 3</button>
//     </div>
//   );
// }

// export default App;

// Exercise 1 - Task 3

// import { useState } from "react";

// function App() {
//   const [name, setName] = useState("");

//   return (
//     <div>
//       <h2>Controlled Input</h2>

//       <input
//         type="text"
//         value={name}
//         onChange={(e) => setName(e.target.value)}
//       />

//       <p>Name: {name}</p>
//     </div>
//   );
// }

// export default App;

// Exercise 1 - Task 4

// import { useState } from "react";

// function App() {
//   const [name, setName] = useState("");

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     const formData = new FormData(e.currentTarget);
//     const submittedName = formData.get("name");

//     console.log("Submitted name:", submittedName);
//   };

//   const handleReset = () => {
//     setName("");
//   };

//   return (
//     <div>
//       <h2>Uncontrolled Input</h2>

//       <form onSubmit={handleSubmit}>
//         <input type="text" name="name" defaultValue="Zaid" />

//         <button type="submit">Submit</button>
//         <button type="button" onClick={handleReset}>
//           Reset
//         </button>
//       </form>
//     </div>
//   );
// }

// export default App;
