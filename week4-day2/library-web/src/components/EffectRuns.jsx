import { useEffect, useState } from "react";

function EffectRuns() {
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    console.log("A");
  });

  useEffect(() => {
    console.log("B");
  }, []);

  useEffect(() => {
    console.log("C");
  }, [filter]);

  return (
    <div>
      <h2>Effect Run Test</h2>

      <p>Current filter: {filter}</p>

      <button onClick={() => setFilter("available")}>Available</button>

      <button onClick={() => setFilter("out")}>Out</button>
    </div>
  );
}

export default EffectRuns;
