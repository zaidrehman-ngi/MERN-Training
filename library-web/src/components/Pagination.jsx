function Pagination({ page, pageCount, onPageChange }) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <nav className="pagination" aria-label="Pages">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>
      <span>
        Page {page} of {pageCount}
      </span>
      <button
        type="button"
        disabled={page === pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}

export default Pagination;
