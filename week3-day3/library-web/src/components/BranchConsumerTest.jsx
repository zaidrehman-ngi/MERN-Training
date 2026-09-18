import useBranch from "../hooks/useBranch";

function BranchConsumerTest() {
  const { branch } = useBranch();

  console.log("BranchConsumerTest rendered");

  return <p>Current branch: {branch}</p>;
}

export default BranchConsumerTest;
