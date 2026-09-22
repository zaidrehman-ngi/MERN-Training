import useBranch from "../hooks/useBranch";

function PanelFooter({ bookCount, totalCount, onBorrow }) {
  const { branch } = useBranch();
  // console.log("PanelFooter rendered");
  
  return (
    <div className="panel__foot">
      <p className="panel__note">
        Showing {bookCount} of {totalCount} titles held at {branch}.
      </p>

      <button className="btn" onClick={onBorrow}>
        Borrow selected
      </button>
    </div>
  );
}

export default PanelFooter;
