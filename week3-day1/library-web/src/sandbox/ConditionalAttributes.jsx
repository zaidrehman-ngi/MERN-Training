function ConditionalAttributes() {
  const book = {
    title: "Dune",
    status: "available",
    copiesOnShelf: 3,
  };

  const rowClass =
    book.status === "overdue" ? "book-row is-overdue" : "book-row";

  const isBorrowDisabled = book.copiesOnShelf === 0;

  let badgeText;
  let badgeClass;

  if (book.status === "available") {
    badgeText = "Available";
    badgeClass = "badge badge--available";
  } else if (book.status === "overdue") {
    badgeText = "Overdue";
    badgeClass = "badge badge--overdue";
  } else {
    badgeText = "Unavailable";
    badgeClass = "badge badge--unavailable";
  }

  return (
    <div className={rowClass}>
      <h2>{book.title}</h2>

      <p className={badgeClass}>{badgeText}</p>

      <p>Copies on shelf: {book.copiesOnShelf}</p>

      <button disabled={isBorrowDisabled}>Borrow</button>
    </div>
  );
}

export default ConditionalAttributes;
