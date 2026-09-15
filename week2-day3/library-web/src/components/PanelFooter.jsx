function PanelFooter({ bookCount, totalCount, branchName, onBorrow }) {
  return (
    <div className="panel__foot">
      <p className="panel__note">
        Showing {bookCount} of {totalCount} titles held at {branchName}.
      </p>

      <button className="btn" onClick={onBorrow}>
        Borrow selected
      </button>
    </div>
  );
}

export default PanelFooter;
