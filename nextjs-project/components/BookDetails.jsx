"use client";

import useToggle from "../hooks/useToggle";

function BookDetails({ book }) {
  const [showMore, toggleShowMore] = useToggle();

  return (
    <>
      <dl className="detailList">
        <div>
          <dt>Author</dt>
          <dd>{book.author ?? "Unknown author"}</dd>
        </div>
        <div>
          <dt>Year</dt>
          <dd>{book.year ?? "Unknown year"}</dd>
        </div>
        <div>
          <dt>Copies</dt>
          <dd>
            {book.onShelf} / {book.totalCopies}
          </dd>
        </div>
        {showMore && (
          <>
            <div>
              <dt>ISBN</dt>
              <dd>{book.isbn}</dd>
            </div>
            <div>
              <dt>Fine per day</dt>
              <dd>Rs. {book.finePerDay}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{book.status}</dd>
            </div>
          </>
        )}
      </dl>
      <div className="detailActions">
        <button type="button" onClick={toggleShowMore}>
          {showMore ? "Fewer details" : "More details"}
        </button>
      </div>
    </>
  );
}

export default BookDetails;
