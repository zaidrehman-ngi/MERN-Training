function BookStatus({ onShelf, totalCopies, finePerDay }) {
  return (
    <div className="row__side">
      <span className="badge">
        {onShelf} of {totalCopies} on shelf
      </span>

      <p className="row__fine">Rs {finePerDay} per day late</p>
    </div>
  );
}

export default BookStatus;
