import { useState } from "react";

function CatalogueBody() {
  const [state, setState] = useState("loading");

  return (
    <div>
      <h2>Catalogue State: {state}</h2>

      <div>
        <button onClick={() => setState("loading")}>Loading</button>
        <button onClick={() => setState("error")}>Error</button>
        <button onClick={() => setState("empty")}>Empty</button>
        <button onClick={() => setState("results")}>Results</button>
      </div>

      {state === "loading" && <p>Loading books...</p>}

      {state === "error" && (
        <p>
          Something went wrong while loading the catalogue. Please try again.
        </p>
      )}

      {state === "empty" && (
        <p>No books found. Try changing your search or filter.</p>
      )}

      {state === "results" && (
        <div>
          <p>Books found:</p>
          <ul>
            <li>Dune</li>
            <li>1984</li>
            <li>Foundation</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default CatalogueBody;
