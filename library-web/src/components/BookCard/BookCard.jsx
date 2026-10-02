import { memo } from "react";
import styles from "./BookCard.module.css";

function BookCard({ book, onSelect, variant = "default" }) {
  const author = book.author ?? "Unknown author";
  const year = book.year ?? "Unknown year";
  const coverUrl = book.coverUrl ?? "/covers/placeholder.jpg";
  const title = book.title ?? "Untitled book";

  const status = ["available", "out", "overdue"].includes(book.status)
    ? book.status
    : "Status unavailable";

  const statusClass =
    {
      available: styles.statusAvailable,
      out: styles.statusOut,
      overdue: styles.statusOverdue,
    }[status] ?? styles.statusUnknown;

  return (
    <article
      className={`${styles.card} ${
        variant === "compact" ? styles.compact : ""
      }`}
    >
      <img className={styles.cover} src={coverUrl} alt={`${title} cover`} />

      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>

        <p className={styles.detail}>{author}</p>
        <p className={styles.detail}>{year}</p>
        <p className={styles.detail}>
          Copies: {book.onShelf} / {book.totalCopies}
        </p>
        <p className={styles.detail}>Fine per day: Rs. {book.finePerDay}</p>

        <p className={`${styles.status} ${statusClass}`}>{status}</p>

        <button
          type="button"
          className={styles.button}
          onClick={() => onSelect?.(book)}
        >
          View Book
        </button>
      </div>
    </article>
  );
}

export default memo(BookCard);