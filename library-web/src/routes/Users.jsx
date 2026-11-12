import { useState } from "react";
import { useUsers } from "../hooks/useUsers";
import useDebounce from "../hooks/useDebounce";
import UserCard from "../components/UserCard/UserCard";
import Pagination from "../components/Pagination";
import { ROLES } from "../constants/roles";

function Users() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);
  const {
    items: users,
    total,
    pageCount,
    status,
    error,
  } = useUsers({
    page,
    search: debouncedSearch,
    role,
  });
  const filtered = debouncedSearch.trim() !== "" || role !== "all";

  return (
    <main>
      <h1>Users</h1>

      <label htmlFor="user-search">Search users</label>
      <input
        id="user-search"
        type="search"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        placeholder="Name, email, or branch"
      />
      <label htmlFor="user-role">Role</label>
      <select
        id="user-role"
        value={role}
        onChange={(event) => {
          setRole(event.target.value);
          setPage(1);
        }}
      >
        <option value="all">All roles</option>
        {ROLES.map((item) => (
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

      {status === "succeeded" && users.length === 0 && (
        <p>{filtered ? "No users match these filters." : "No users found."}</p>
      )}

      {status === "succeeded" && users.length > 0 && (
        <>
          <p>
            Showing {users.length} of {total} users
          </p>
          <div>
            {users.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
          <Pagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        </>
      )}
    </main>
  );
}

export default Users;
