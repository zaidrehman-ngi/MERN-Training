import { createContext, useMemo, useState } from "react";

const BranchContext = createContext(null);

export function BranchProvider({ children }) {
  const [branch, setBranch] = useState("Clifton Branch");
  const [member, setMember] = useState("Zaid");
  // const [count, setCount] = useState(0);

  const value = useMemo(() => ({ branch, member }), [branch, member]);

  return (
    <BranchContext.Provider value={value}>
      {/* <button onClick={() => setCount((current) => current + 1)}>
        Unrelated count: {count}
      </button> */}

      {/* <button onClick={() => setBranch("North Nazimabad Branch")}>
        Change Branch
      </button> */}

      {children}
    </BranchContext.Provider>
  );
}

export default BranchContext;
