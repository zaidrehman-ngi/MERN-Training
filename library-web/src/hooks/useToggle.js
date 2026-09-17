import { useState } from "react";

function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = () => {
    setValue((currentValue) => !currentValue);
  };

  return [value, toggle];
}

export default useToggle;

// import { createElement, useState } from "react";

// function useToggle(initialValue = false) {
//   const [value, setValue] = useState(initialValue);

//   const toggle = () => {
//     setValue((currentValue) => !currentValue);
//   };

//   const panel = value && createElement("p", null, "This is the toggle panel.");

//   return [value, toggle, panel];
// }

// export default useToggle;
