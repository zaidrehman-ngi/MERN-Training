import { useContext } from "react";
import BranchContext from "../context/BranchContext";

function useBranch() {
  const context = useContext(BranchContext);

  if (context === null) {
    throw new Error("useBranch must be used within a BranchProvider.");
  }

  return context;
}

export default useBranch;
