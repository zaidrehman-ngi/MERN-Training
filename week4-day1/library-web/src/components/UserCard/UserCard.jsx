import styles from "./UserCard.module.css";

function UserCard({ user }) {
  return (
    <article className={styles.card}>
      <h2 className={styles.name}>{user.name}</h2>
      <p className={styles.detail}>Email: {user.email}</p>
      <p className={styles.detail}>Membership: {user.membershipType}</p>
      <p className={styles.status}>Status: {user.status}</p>
    </article>
  );
}

export default UserCard;
