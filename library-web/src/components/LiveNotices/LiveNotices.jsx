import toast, { Toaster } from "react-hot-toast";
import { Link } from "react-router-dom";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useSocketEvent } from "../../hooks/useSocketEvent";
import { SOCKET_EVENTS } from "../../constants/socketEvents";
import { formatDay } from "../../utils/dates";

const STATUS_TEXT = {
  approved: "was approved. You can collect it at the desk.",
  rejected: "was rejected.",
  expired: "expired because it wasn't collected in time.",
  returned: "has been marked as returned.",
};

const notify = (text) =>
  toast((t) => (
    <span>
      {text}{" "}
      <Link to="/borrow-requests" onClick={() => toast.dismiss(t.id)}>
        View requests
      </Link>
    </span>
  ));

function LiveNotices() {
  const { user, can } = useCurrentUser();

  // goes to the member and to the staff counter; only the member gets a notice
  useSocketEvent(
    SOCKET_EVENTS.REQUEST_STATUS_CHANGED,
    ({ userId, bookTitle, status }) => {
      if (userId === user?.id && STATUS_TEXT[status]) {
        notify(`Your request for "${bookTitle}" ${STATUS_TEXT[status]}`);
      }
    },
  );

  useSocketEvent(
    SOCKET_EVENTS.QUEUE_PROMOTED,
    ({ userId, bookTitle, holdUntil }) => {
      if (userId === user?.id) {
        notify(
          `You're at the front of the queue. A copy of "${bookTitle}" is held for you until ${formatDay(holdUntil)}.`,
        );
      }
    },
  );

  useSocketEvent(SOCKET_EVENTS.LOAN_DUE_SOON, ({ message }) => notify(message));

  useSocketEvent(SOCKET_EVENTS.REQUEST_CREATED, ({ bookTitle, userName }) => {
    if (can("requests:seeAll")) {
      notify(`New request: "${bookTitle}" from ${userName}.`);
    }
  });

  return <Toaster position="top-right" toastOptions={{ duration: 10000 }} />;
}

export default LiveNotices;
