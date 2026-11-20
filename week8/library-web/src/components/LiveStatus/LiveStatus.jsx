import { useSocket } from "../../hooks/useSocket";
import styles from "./LiveStatus.module.css";

const LABELS = {
  connected: {
    text: "Live",
    title: "Changes from other people show up straight away.",
  },
  connecting: {
    text: "Connecting...",
    title: "Opening the live connection.",
  },
  reconnecting: {
    text: "Reconnecting...",
    title: "The live connection dropped. What you see may be out of date.",
  },
  offline: {
    text: "Offline",
    title: "No live updates. Refresh the page once you are back online.",
  },
};

function LiveStatus() {
  const { status } = useSocket();
  const label = LABELS[status] ?? LABELS.offline;

  return (
    <span
      className={`${styles.status} ${styles[status] ?? styles.offline}`}
      role="status"
      title={label.title}
      data-testid="live-status"
    >
      <span className={styles.dot} aria-hidden="true" />
      {label.text}
    </span>
  );
}

export default LiveStatus;
