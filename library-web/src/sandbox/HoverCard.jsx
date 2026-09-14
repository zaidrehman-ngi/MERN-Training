import { useState } from "react";

function HoverCard() {
  const [showISBN, setShowISBN] = useState(false);

  return (
    <div
      onMouseEnter={() => setShowISBN(true)}
      onMouseLeave={() => setShowISBN(false)}
    >
      <h3>Dune</h3>
      <p>Frank Herbert</p>

      {showISBN && <p>ISBN: 9780441013593</p>}
    </div>
  );
}

export default HoverCard;
