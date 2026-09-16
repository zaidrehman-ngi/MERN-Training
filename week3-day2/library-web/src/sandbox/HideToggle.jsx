import { useState } from "react";

function HideToggle() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "Hide Panels" : "Show Panels"}
      </button>

      <h3>1. Leave it out of the tree</h3>

      {isOpen && <Panel label="Conditional Panel" />}

      <h3>2. display: none</h3>

      <div style={{ display: isOpen ? "block" : "none" }}>
        <Panel label="CSS Hidden Panel" />
      </div>
    </div>
  );
}

function Panel({ label }) {
  console.log(`${label} rendered`);

  return <p>{label}</p>;
}

export default HideToggle;
