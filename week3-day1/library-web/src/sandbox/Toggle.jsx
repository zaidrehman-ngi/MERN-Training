import { useState } from "react";

function Toggle() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "Hide Panel" : "Show Panel"}
      </button>

      {isOpen && <p>This is the toggle panel.</p>}
    </div>
  );
}

export default Toggle;
