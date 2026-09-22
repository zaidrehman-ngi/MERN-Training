function BookCardInline({ book, onSelect, variant = "default" }) {
  const author = book.author ?? "Unknown author";
  const year = book.year ?? "Unknown year";
  const coverUrl = book.coverUrl ?? "/covers/placeholder.jpg";
  const title = book.title ?? "Untitled book";

  const status = ["available", "out", "overdue"].includes(book.status)
    ? book.status
    : "Status unavailable";

  const isCompact = variant === "compact";
  const statusColour =
    {
      available: "var(--colour-available)",
      out: "var(--colour-out)",
      overdue: "var(--colour-overdue)",
    }[status] ?? "var(--colour-surface-sunk)";
  const statusTextColour =
    {
      available: "var(--colour-on-available)",
      out: "var(--colour-on-out)",
      overdue: "var(--colour-on-overdue)",
    }[status] ?? "var(--colour-body)";

  const cardStyle = {
    display: "flex",
    gap: "var(--space-4)",
    padding: isCompact ? "var(--space-3)" : "var(--space-4)",
    border: "var(--border-width-card) solid var(--colour-line)",
    borderRadius: "var(--radius-md)",
    backgroundColor: "var(--colour-surface)",
    color: "var(--colour-ink)",
    fontFamily: "var(--font-body)",
  };

  const coverStyle = {
    width: isCompact
      ? "var(--book-cover-width-compact)"
      : "var(--book-cover-width)",
    height: isCompact
      ? "var(--book-cover-height-compact)"
      : "var(--book-cover-height)",
    objectFit: "cover",
    flexShrink: 0,
  };

  const contentStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "var(--space-1)",
  };

  const titleStyle = {
    margin: `0 0 var(--space-2)`,
    fontSize: "var(--text-lg)",
    lineHeight: "var(--leading-tight)",
  };

  const detailStyle = {
    margin: 0,
    fontSize: "var(--text-sm)",
    color: "var(--colour-body)",
  };

  const statusStyle = {
    margin: "var(--space-1) 0",
    padding: `var(--space-1) var(--space-2)`,
    borderRadius: "var(--radius-sm)",
    backgroundColor: statusColour,
    color: statusTextColour,
    fontSize: "var(--text-xs)",
    lineHeight: "var(--leading-tight)",
  };

  const buttonStyle = {
    marginTop: "var(--space-2)",
    padding: "var(--space-2) var(--space-3)",
    border: "var(--border-width-card) solid var(--colour-accent)",
    borderRadius: "var(--radius-sm)",
    backgroundColor: "var(--colour-accent)",
    color: "var(--colour-surface)",
    font: "inherit",
    fontSize: "var(--text-sm)",
    cursor: "pointer",
  };

  return (
    <article style={cardStyle}>
      <img src={coverUrl} alt={`${title} cover`} style={coverStyle} />

      <div style={contentStyle}>
        <h3 style={titleStyle}>{title}</h3>

        <p style={detailStyle}>{author}</p>

        <p style={detailStyle}>{year}</p>

        <p style={statusStyle}>{status}</p>

        <button
          type="button"
          onClick={() => onSelect?.(book)}
          style={buttonStyle}
        >
          View Book
        </button>
      </div>
    </article>
  );
}

export default BookCardInline;
