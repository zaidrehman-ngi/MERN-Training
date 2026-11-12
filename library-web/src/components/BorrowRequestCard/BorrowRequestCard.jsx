import { formatDay } from "../../utils/dates";
import styles from "./BorrowRequestCard.module.css";

function BorrowRequestCard({ request }) {
  return (
    <article className={styles.card}>
      <h2 className={styles.bookTitle}>{request.id}</h2>

      <p className={styles.detail}>Book ID: {request.bookId}</p>
      <p className={styles.detail}>User ID: {request.userId}</p>
      <p className={styles.detail}>
        Requested: {formatDay(request.requestedAt)}
      </p>
      <p className={styles.detail}>Due: {formatDay(request.dueDate)}</p>
      <p className={styles.detail}>Fine per day: Rs. {request.finePerDay}</p>
      <p className={styles.status}>Status: {request.status}</p>
    </article>
  );
}

export default BorrowRequestCard;
