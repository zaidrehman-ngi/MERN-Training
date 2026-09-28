import { useState } from "react";
import { useUsers } from "../hooks/useUsers";
import UserCard from "../components/UserCard/UserCard";

function Users() {
  const { users, status, error } = useUsers();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const roles = [...new Set(users.map((user) => user.role).filter(Boolean))];
  const query = search.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    const matchesRole = role === "all" || user.role === role;
    const matchesSearch =
      !query ||
      [user.name, user.email, user.branch]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    return matchesRole && matchesSearch;
  });

  return (
    <main>
      <h1>Users</h1>

      <label htmlFor="user-search">Search users</label>
      <input
        id="user-search"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Name, email, or branch"
      />
      <label htmlFor="user-role">Role</label>
      <select
        id="user-role"
        value={role}
        onChange={(event) => setRole(event.target.value)}
      >
        <option value="all">All roles</option>
        {roles.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      {status === "idle" && <p role="status">Waiting to load users...</p>}
      {status === "loading" && <p role="status">Loading users...</p>}
      {status === "failed" && (
        <p role="alert">
          {error?.message || "Something went wrong while loading users."}
        </p>
      )}

      {status === "succeeded" && users.length === 0 && <p>No users found.</p>}

      {status === "succeeded" && users.length > 0 && filteredUsers.length === 0 && (
        <p>No users match these filters.</p>
      )}

      {status === "succeeded" && filteredUsers.length > 0 && (
        <div>
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </main>
  );
}

export default Users;
