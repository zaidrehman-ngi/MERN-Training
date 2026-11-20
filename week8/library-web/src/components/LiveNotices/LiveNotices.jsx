import toast, { Toaster } from "react-hot-toast";
import { Link } from "react-router-dom";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useSocketEvent } from "../../hooks/useSocketEvent";
import { SOCKET_EVENTS } from "../../constants/socketEvents";
import { formatDay } from "../../utils/dates";
import styles from "./LiveNotices.module.css";

const STATUS_TEXT = {
  approved: "was approved. You can collect it at the desk.",
  rejected: "was rejected.",
  expired: "expired because it wasn't collected in time.",
  returned: "has been marked as returned.",
};

const STATUS_TONE = {
  approved: "success",
  rejected: "danger",
  expired: "danger",
  returned: "info",
};

const notify = (text, tone = "info") =>
  toast.custom(
    (t) => (
      <div
        className={`${styles.notice} ${styles[tone]} ${
          t.visible ? styles.enter : styles.leave
        }`}
        role="status"
      >
        <p className={styles.text}>{text}</p>
        <div className={styles.actions}>
          <Link
            className={styles.view}
            to="/borrow-requests"
            onClick={() => toast.dismiss(t.id)}
          >
            View requests
          </Link>
        </div>
        <button
          type="button"
          className={styles.close}
          aria-label="Dismiss"
          onClick={() => toast.dismiss(t.id)}
        >
          ×
        </button>
      </div>
    ),
    { duration: 10000 },
  );

function LiveNotices() {
  const { user, can } = useCurrentUser();

  // goes to the member and to the staff counter; only the member gets a notice
  useSocketEvent(
    SOCKET_EVENTS.REQUEST_STATUS_CHANGED,
    ({ userId, bookTitle, status }) => {
      if (userId === user?.id && STATUS_TEXT[status]) {
        notify(
          `Your request for "${bookTitle}" ${STATUS_TEXT[status]}`,
          STATUS_TONE[status],
        );
      }
    },
  );

  useSocketEvent(
    SOCKET_EVENTS.QUEUE_PROMOTED,
    ({ userId, bookTitle, holdUntil }) => {
      if (userId === user?.id) {
        notify(
          `You're at the front of the queue. A copy of "${bookTitle}" is held for you until ${formatDay(holdUntil)}.`,
          "success",
        );
      }
    },
  );

  useSocketEvent(SOCKET_EVENTS.LOAN_DUE_SOON, ({ message }) =>
    notify(message, "warning"),
  );

  useSocketEvent(SOCKET_EVENTS.REQUEST_CREATED, ({ bookTitle, userName }) => {
    if (can("requests:seeAll")) {
      notify(`New request: "${bookTitle}" from ${userName}.`);
    }
  });

  return <Toaster position="top-right" gutter={12} />;
}

export default LiveNotices;
