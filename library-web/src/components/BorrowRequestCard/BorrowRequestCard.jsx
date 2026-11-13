import { formatDay } from "../../utils/dates";
import styles from "./BorrowRequestCard.module.css";

function BorrowRequestCard({ request, showMember, position, children }) {
  return (
    <article className={styles.card}>
      <h2 className={styles.bookTitle}>{request.book.title}</h2>

      {showMember && (
        <p className={styles.detail}>Member: {request.user.name}</p>
      )}
      <p className={styles.detail}>
        Requested: {formatDay(request.requestedAt)}
      </p>
      {request.dueDate && (
        <p className={styles.detail}>Due: {formatDay(request.dueDate)}</p>
      )}
      {request.holdUntil && (
        <p className={styles.detail}>
          Held until: {formatDay(request.holdUntil)}
        </p>
      )}
      {request.fine > 0 && (
        <p className={styles.detail}>Fine: Rs. {request.fine}</p>
      )}
      <p className={styles.status}>Status: {request.status}</p>
      {request.status === "queued" && position && (
        <p className={styles.detail}>Place in queue: {position}</p>
      )}
      {children}
    </article>
  );
}

export default BorrowRequestCard;
