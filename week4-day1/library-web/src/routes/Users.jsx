import { useUsers } from "../hooks/useUsers";
import UserCard from "../components/UserCard/UserCard";

function Users() {
  const { users, loading, error } = useUsers();

  return (
    <main>
      <h1>Users</h1>

      {loading && <p>Loading users...</p>}

      {!loading && error && <p>Something went wrong while loading users.</p>}

      {!loading && !error && users.length === 0 && <p>No users found.</p>}

      {!loading && !error && users.length > 0 && (
        <div>
          {users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </main>
  );
}

export default Users;
