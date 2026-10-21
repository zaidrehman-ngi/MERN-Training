import styles from "./UserCard.module.css";

function UserCard({ user }) {
  return (
    <article className={styles.card}>
      <h2 className={styles.name}>{user.name}</h2>

      <p className={styles.detail}>Email: {user.email}</p>
      <p className={styles.detail}>Role: {user.role}</p>
      <p className={styles.detail}>Branch: {user.branch}</p>
      <p className={styles.detail}>Joined: {user.joined}</p>
    </article>
  );
}

export default UserCard;
