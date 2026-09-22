import styles from "./BorrowRequestCard.module.css";

function BorrowRequestCard({ request }) {
  return (
    <article className={styles.card}>
      <h2 className={styles.bookTitle}>{request.bookTitle}</h2>
      <p className={styles.detail}>User: {request.userName}</p>
      <p className={styles.detail}>Requested: {request.requestedAt}</p>
      <p className={styles.status}>Status: {request.status}</p>
    </article>
  );
}

export default BorrowRequestCard;
